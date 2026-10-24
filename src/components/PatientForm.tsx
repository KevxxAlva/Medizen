import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCreatePatient, useUpdatePatient, usePatient, type Patient } from "@/lib/api/patients";
import { useDoctors } from "@/lib/api/profiles";
import { useAuthSession, useIsAdmin } from "@/hooks/useAuth";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { usePatientFormState } from "./patient-form/usePatientFormState";
import { PatientFormBody } from "./patient-form/PatientFormBody";

const STATUSES = ["nuevo", "activo", "en_tratamiento", "alta"];
const statusLabel = (s: string) =>
  (
    ({
      nuevo: "Nuevo",
      activo: "Activo",
      en_tratamiento: "En tratamiento",
      alta: "Alta",
    }) as Record<string, string>
  )[s] ?? s;

export function PatientForm({
  open,
  onOpenChange,
  patient: initialPatient,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  patient?: Patient | null;
}) {
  const isEdit = !!initialPatient;
  const { data: fullPatient, isLoading: isPatientDetailLoading } = usePatient(initialPatient?.id);
  const patient = isEdit ? fullPatient : null;
  const { user } = useAuthSession();
  const isAdmin = useIsAdmin();
  const { data: doctors = [] } = useDoctors();

  const defaultDoctor = useMemo(
    () => patient?.assigned_doctor_id ?? (isAdmin ? (doctors[0]?.id ?? "") : (user?.id ?? "")),
    [patient, isAdmin, doctors, user],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col rounded-3xl p-6">
        <DialogHeader className="pb-2">
          <DialogTitle>{isEdit ? "Editar historia clínica" : "Nueva historia clínica"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualiza el registro médico de la paciente."
              : "Registra los datos clínicos de la paciente."}
          </DialogDescription>
        </DialogHeader>

        {isEdit && isPatientDetailLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <PatientFormContent
            key={open ? (patient?.id ?? "new") : "closed"}
            patient={patient}
            defaultDoctor={defaultDoctor}
            isEdit={isEdit}
            doctors={doctors}
            user={user}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PatientFormContent({
  patient,
  defaultDoctor,
  isEdit,
  doctors,
  user,
  onOpenChange,
}: {
  patient?: Patient | null;
  defaultDoctor: string;
  isEdit: boolean;
  doctors: any[];
  user: any;
  onOpenChange: (v: boolean) => void;
}) {
  const formState = usePatientFormState(patient, defaultDoctor);

  const create = useCreatePatient();
  const update = useUpdatePatient();
  const busy = create.isPending || update.isPending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.full_name.trim()) {
      toast.error("Por favor ingrese el nombre completo del paciente");
      return;
    }
    const doctorId =
      formState.assigned_doctor_id ||
      defaultDoctor ||
      (doctors[0]?.id ? String(doctors[0].id) : (user?.id ?? ""));
    if (!doctorId) {
      toast.error("Por favor seleccione un médico asignado");
      return;
    }
    try {
      const combinedDocId = formState.idNumber.trim()
        ? `${formState.idPrefix === "none" ? "" : formState.idPrefix}${formState.idNumber.trim()}`
        : null;

      const payload = {
        full_name: formState.full_name.trim(),
        email: formState.email.trim() || null,
        phone: formState.phoneNumber.trim()
          ? `${formState.phonePrefix} ${formState.phoneNumber.trim()}`
          : null,
        birth_date: formState.birth_date || null,
        gender: formState.gender.trim() || null,
        blood_type: formState.blood_type.trim() || null,
        emergency_contact: formState.emergency_contact.trim() || null,
        insurance_provider: formState.insurance_provider.trim() || null,
        status: formState.status,
        assigned_doctor_id: doctorId,
        address: formState.address.trim() || null,
        notes: formState.notes.trim() || null,
        document_id: combinedDocId,

        // Extended clinical columns
        historia_number: formState.historia_number.trim() || null,
        first_visit_date: formState.first_visit_date || null,
        marital_status: formState.marital_status.trim() || null,
        birthplace: formState.birthplace.trim() || null,
        education_level: formState.education_level.trim() || null,
        occupation: formState.occupation.trim() || null,
        ethnicity: formState.ethnicity.trim() || null,
        consultation_reason: formState.consultation_reason.trim() || null,
        current_illness: formState.current_illness.trim() || null,

        family_history: {
          mother: formState.famMother || null,
          father: formState.famFather || null,
          siblings: formState.famSiblings || null,
          children: formState.famChildren || null,
        },
        personal_history: {
          alcohol: formState.persAlcohol || null,
          drugs: formState.persDrugs || null,
          tobacco: formState.persTobacco || null,
          base_pathology: formState.persBase || null,
          surgical: formState.persSurgical || null,
          allergies: formState.persAllergies || null,
          current_medications: formState.persMedications || null,
          transfusions: formState.persTransfusions || null,
        },
        gynecological_data: {
          menarche: formState.gynMenarche !== "" ? formState.gynMenarche : null,
          sexarche: formState.gynSexarche !== "" ? formState.gynSexarche : null,
          menstrual_cycle: formState.gynCycle || null,
          dysmenorrhea: formState.gynDismenorrea || null,
          nps: formState.gynNps !== "" ? formState.gynNps : null,
          its: formState.gynIts || null,
          cytology: formState.gynCytology || null,
          contraceptives: formState.gynContraceptives || null,
        },
        obstetric_data: {
          g: formState.obsG !== "" ? formState.obsG : null,
          p: formState.obsP !== "" ? formState.obsP : null,
          c: formState.obsC !== "" ? formState.obsC : null,
          a: formState.obsA !== "" ? formState.obsA : null,
          pig: formState.obsPig || null,
          em: formState.obsEm !== "" ? formState.obsEm : null,
          ee: formState.obsEe !== "" ? formState.obsEe : null,
          complications: formState.obsComplications || null,
          fum: formState.obsFum || null,
          eg: formState.obsEg || null,
          fpp: formState.obsFpp || null,
          num_consultations:
            formState.obsNumConsultations !== "" ? formState.obsNumConsultations : null,
          vaccines: formState.obsVaccines || null,
        },
      };

      if (isEdit && patient) {
        await update.mutateAsync({ id: patient.id, ...payload });
        toast.success("Paciente actualizado con éxito");
      } else {
        await create.mutateAsync(payload);
        toast.success("Paciente creado con éxito");
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error guardando paciente:", err);
      let errorMsg = "Error al guardar el paciente";
      const rawMsg =
        err?.message ||
        err?.error_description ||
        err?.details ||
        (typeof err === "string" ? err : "");

      if (
        rawMsg.includes("pacientes_documento_identidad_key") ||
        rawMsg.includes("documento_identidad")
      ) {
        errorMsg =
          "Ya existe un paciente registrado con este documento de identidad (cédula/pasaporte).";
      } else if (rawMsg.includes("pacientes_email_key") || rawMsg.includes("email")) {
        errorMsg = "El correo electrónico ya se encuentra registrado para otro paciente.";
      } else if (rawMsg) {
        errorMsg = rawMsg;
      }
      toast.error(errorMsg);
    }
  };

  return (
    <form onSubmit={submit} className="flex-1 flex flex-col min-h-0">
      <PatientFormBody
        formState={formState}
        doctors={doctors}
        STATUSES={STATUSES}
        statusLabel={statusLabel}
        busy={busy}
        isEdit={isEdit}
        onCancel={() => onOpenChange(false)}
      />
    </form>
  );
}

export default PatientForm;
