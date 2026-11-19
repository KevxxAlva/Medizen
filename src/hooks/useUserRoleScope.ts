import { useMemo } from "react";
import { useAuthSession, useRoles } from "./useAuth";
import { useMyProfile, useDoctors, type DoctorOption } from "@/lib/api/profiles";

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

interface AuthUserLike {
  id?: string;
  email?: string | null;
  user_metadata?: {
    role?: string;
    full_name?: string;
    specialty?: string;
  };
}

interface ProfileLike {
  role?: string | null;
  doctor_id?: string | number | null;
  full_name?: string | null;
  specialty_id?: number | null;
  specialty?: string | null;
}

function normalizeStr(val: string | null | undefined): string {
  return (val ?? "").toLowerCase().trim();
}

function findMatchingDoctor(
  doctors: DoctorOption[],
  user: AuthUserLike | null,
  profileDoctorId?: string | number | null,
): DoctorOption | null {
  if (!user) return null;
  const userEmail = normalizeStr(user.email);
  const metaFullName = normalizeStr(user.user_metadata?.full_name);
  const profDocStr = profileDoctorId ? String(profileDoctorId) : "";

  for (const d of doctors) {
    if (d.auth_id && d.auth_id === user.id) return d;
    if (profDocStr && String(d.id) === profDocStr) return d;
    if (userEmail && normalizeStr(d.email) === userEmail) return d;
    if (metaFullName && normalizeStr(d.full_name) === metaFullName) return d;
  }
  return null;
}

function computeRoleFlags(
  roles: string[],
  userMetaRole: string,
  profileRole: string,
) {
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
  const isDoctor = !isAdmin && !isReceptionist;
  const canViewAllDoctors = isAdmin || isReceptionist;
  const isDoctorOnly = isDoctor && !canViewAllDoctors;

  return { isAdmin, isReceptionist, isDoctor, canViewAllDoctors, isDoctorOnly };
}

function resolveDoctorMetadata(
  currentDoctor: DoctorOption | null,
  profile: ProfileLike | null | undefined,
  user: AuthUserLike | null,
) {
  const doctorId = currentDoctor?.id || (profile?.doctor_id ? String(profile.doctor_id) : null);
  const doctorName =
    currentDoctor?.full_name ||
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    null;
  const doctorSpecialtyId = currentDoctor?.specialty_id || profile?.specialty_id || null;
  const doctorSpecialtyName =
    currentDoctor?.specialty || profile?.specialty || user?.user_metadata?.specialty || null;

  return { doctorId, doctorName, doctorSpecialtyId, doctorSpecialtyName };
}

export function useUserRoleScope(): UserRoleScope {
  const { user, loading: authLoading } = useAuthSession();
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: profile, isLoading: profileLoading } = useMyProfile(user?.id);
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctors();

  const currentDoctor = useMemo(
    () => findMatchingDoctor(doctors, user, profile?.doctor_id),
    [doctors, user, profile?.doctor_id],
  );

  const flags = useMemo(
    () =>
      computeRoleFlags(
        roles,
        normalizeStr(user?.user_metadata?.role),
        normalizeStr(profile?.role),
      ),
    [roles, user?.user_metadata?.role, profile?.role],
  );

  const meta = useMemo(
    () => resolveDoctorMetadata(currentDoctor, profile, user),
    [currentDoctor, profile, user],
  );

  return {
    ...flags,
    ...meta,
    isLoading: authLoading || rolesLoading || profileLoading || doctorsLoading,
  };
}
