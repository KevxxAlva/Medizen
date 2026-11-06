import { useMemo } from "react";
import { useAuthSession, useRoles } from "./useAuth";
import { useMyProfile, useDoctors } from "@/lib/api/profiles";

export interface UserRoleScope {
  isAdmin: boolean;
  isReceptionist: boolean;
  isDoctor: boolean;
  isDoctorOnly: boolean;
  doctorId: string | null;
  doctorName: string | null;
  doctorSpecialtyId: number | null;
  doctorSpecialtyName: string | null;
  canViewAllDoctors: boolean;
  isLoading: boolean;
}

export function useUserRoleScope(): UserRoleScope {
  const { user, loading: authLoading } = useAuthSession();
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: profile, isLoading: profileLoading } = useMyProfile(user?.id);
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctors();

  const currentDoctor = useMemo(() => {
    if (!user) return null;
    const userEmail = (user.email || "").toLowerCase().trim();
    const metaFullName = (user.user_metadata?.full_name || "").toLowerCase().trim();

    return (
      doctors.find(
        (d) =>
          (d.auth_id && d.auth_id === user.id) ||
          (profile?.doctor_id && String(d.id) === String(profile.doctor_id)) ||
          (d.email && d.email.toLowerCase().trim() === userEmail) ||
          (metaFullName && d.full_name && d.full_name.toLowerCase().trim() === metaFullName)
      ) || null
    );
  }, [doctors, user, profile?.doctor_id]);

  const userMetaRole = (user?.user_metadata?.role || "").toLowerCase();
  const profileRole = (profile?.role || "").toLowerCase();
  const normalizedRoles = roles.map((r) => r.toLowerCase());

  const isAdmin =
    normalizedRoles.includes("admin") ||
    userMetaRole === "admin" ||
    profileRole.includes("admin");

  const isReceptionist =
    !isAdmin &&
    (normalizedRoles.includes("recepcionista") ||
      userMetaRole === "recepcionista" ||
      profileRole.includes("recep"));

  // Default any authenticated user who is not an Admin or Receptionist to Doctor role.
  // This guarantees that medical and revenue data of other doctors is NEVER leaked to a doctor.
  const isDoctor =
    !isAdmin &&
    !isReceptionist &&
    (normalizedRoles.includes("doctor") ||
      normalizedRoles.includes("medico") ||
      userMetaRole === "doctor" ||
      userMetaRole === "medico" ||
      profileRole.includes("doc") ||
      profileRole.includes("med") ||
      Boolean(currentDoctor) ||
      Boolean(profile?.doctor_id) ||
      true);

  // Model 2 Core Rule:
  // Admin and Receptionist have 360-degree vision over all clinic revenues and doctors.
  // Dedicated Doctors (without admin/receptionist privileges) are strictly scoped to their own individual data.
  const canViewAllDoctors = isAdmin || isReceptionist;
  const isDoctorOnly = isDoctor && !canViewAllDoctors;

  const resolvedDoctorId =
    currentDoctor?.id || profile?.doctor_id || null;

  const resolvedDoctorName =
    currentDoctor?.full_name || profile?.full_name || user?.user_metadata?.full_name || user?.email || null;

  const resolvedSpecialtyId =
    currentDoctor?.specialty_id || profile?.specialty_id || null;

  const resolvedSpecialtyName =
    currentDoctor?.specialty || profile?.specialty || user?.user_metadata?.specialty || null;

  return {
    isAdmin,
    isReceptionist,
    isDoctor,
    isDoctorOnly,
    doctorId: resolvedDoctorId,
    doctorName: resolvedDoctorName,
    doctorSpecialtyId: resolvedSpecialtyId,
    doctorSpecialtyName: resolvedSpecialtyName,
    canViewAllDoctors,
    isLoading: authLoading || rolesLoading || profileLoading || doctorsLoading,
  };
}
