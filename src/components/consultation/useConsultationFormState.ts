import { useState, useEffect, useMemo, useRef } from "react";
import {
  useCreateConsultation,
  useUpdateConsultation,
  type VisitType,
  type Consultation,
} from "@/lib/api/consultations";
import { useUpdateAppointment } from "@/lib/api/appointments";
import { usePatient } from "@/lib/api/patients";
import { useDoctors } from "@/lib/api/profiles";
import { useStocks } from "@/lib/api/inventory";
import { useClinicInfo } from "@/lib/api/clinic";
import { supabase } from "@/integrations/supabase/client";
import { generateRecipePDF } from "@/lib/utils/recipePdf";
import { sendRecipeViaWhatsApp } from "@/lib/utils/whatsapp";
import { toast } from "sonner";
import {
  CLINICAL_TEMPLATES,
  PRESCRIPTION_TEMPLATES,
  getTemplatesForSpecialty,
  getPrescriptionsForSpecialty,
} from "@/lib/constants/clinicalTemplates";
import { getSpecialtyConfig } from "@/lib/constants/specialtyForms";
import { calculateBmiWithCategory } from "@/lib/utils/medicalCalculators";

export function getInitialSpecialtyAnswers(
  existingConsultation: Consultation | null | undefined,
): Record<string, any> {
  if (!existingConsultation) return {};
  const answers: Record<string, any> = {
    ...(existingConsultation.specialty_data || {}),
  };
  if (existingConsultation.acetic_acid_test)
    answers.acetic_acid_test = existingConsultation.acetic_acid_test;
  if (existingConsultation.acetic_clock_position)
    answers.acetic_clock_position = existingConsultation.acetic_clock_position;
  if (existingConsultation.acetic_relative_position)
    answers.acetic_relative_position = existingConsultation.acetic_relative_position;
  if (existingConsultation.lugol_test) answers.lugol_test = existingConsultation.lugol_test;
  if (existingConsultation.lugol_clock_position)
    answers.lugol_clock_position = existingConsultation.lugol_clock_position;
  if (existingConsultation.lugol_relative_position)
    answers.lugol_relative_position = existingConsultation.lugol_relative_position;
  if (existingConsultation.gestational_age)
    answers.gestational_age = existingConsultation.gestational_age;
  if (existingConsultation.fetal_weight) answers.fetal_weight = existingConsultation.fetal_weight;
  if (existingConsultation.obstetric_bp) answers.obstetric_bp = existingConsultation.obstetric_bp;
  if (existingConsultation.uterine_height)
    answers.uterine_height = existingConsultation.uterine_height;
  if (existingConsultation.presentation) answers.presentation = existingConsultation.presentation;
  if (existingConsultation.fetal_heart_rate)
    answers.fetal_heart_rate = existingConsultation.fetal_heart_rate;
  if (existingConsultation.fetal_movements)
    answers.fetal_movements = existingConsultation.fetal_movements;
  if (existingConsultation.edema) answers.edema = existingConsultation.edema;
  if (existingConsultation.alarm_signs) answers.alarm_signs = existingConsultation.alarm_signs;
  return answers;
}

export function getInitialConsumables(
  existingConsultation: Consultation | null | undefined,
  dynamicConsumables: { name: string; defaultUnit: string }[],
) {
  const commonMap: Record<string, string> = {};
  const customs: { id?: string; item_name: string; quantity: string; unit: string }[] = [];

  (existingConsultation?.consumables ?? []).forEach((c) => {
    const isCommon = dynamicConsumables.some((item) => item.name === c.item_name);
    if (isCommon) {
      commonMap[c.item_name] = String(c.quantity);
    } else {
      customs.push({
        id: (c as { id?: string }).id || crypto.randomUUID(),
        item_name: c.item_name,
        quantity: String(c.quantity),
        unit: c.unit ?? "U",
      });
    }
  });

  return { commonMap, customs };
}

function useConsultationConsumables(
  stocks: any[],
  existingConsultation: Consultation | null | undefined,
) {
  const dynamicConsumables = useMemo(() => {
    return stocks
      .filter((s) =>
        ["Consumables", "Medical Supplies", "Consumibles", "Suministros Médicos"].includes(
          s.category,
        ),
      )
      .map((s) => ({ name: s.name, defaultUnit: "U" }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stocks]);

  const initialConsumables = useMemo(
    () => getInitialConsumables(existingConsultation, dynamicConsumables),
    [existingConsultation, dynamicConsumables],
  );

  const [commonQuantities, setCommonQuantities] = useState<Record<string, string>>(
    () => initialConsumables.commonMap,
  );
  const [customConsumables, setCustomConsumables] = useState(() => initialConsumables.customs);

  const addCustomConsumable = () => {
    setCustomConsumables((prev) => [
      ...prev,
      { id: crypto.randomUUID(), item_name: "", quantity: "1", unit: "U" },
    ]);
  };

  const removeCustomConsumable = (idx: number) => {
    setCustomConsumables((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCustomConsumable = (
    idx: number,
    key: "item_name" | "quantity" | "unit",
    val: string,
  ) => {
    setCustomConsumables((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      return next;
    });
  };

  const updateCommonQty = (name: string, val: string) => {
    setCommonQuantities((prev) => ({ ...prev, [name]: val }));
  };

  return {
    dynamicConsumables,
    commonQuantities,
    customConsumables,
    addCustomConsumable,
    removeCustomConsumable,
    updateCustomConsumable,
    updateCommonQty,
  };
}

function useConsultationDoctorAndSpecialty(
  doctors: any[],
  existingConsultation: Consultation | null | undefined,
  appointment: any,
  currentUserId: string | null,
  currentUserEmail: string | null,
) {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    () => existingConsultation?.doctor_id || appointment?.doctor_id || "",
  );
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(
    () => existingConsultation?.specialty_name || "Ginecología y Obstetricia",
  );
  const [specialtyAnswers, setSpecialtyAnswers] = useState<Record<string, any>>(() =>
    getInitialSpecialtyAnswers(existingConsultation),
  );

  const currentDoctor = useMemo(() => {
    if (selectedDoctorId) {
      const match = doctors.find((d) => d.id === selectedDoctorId);
      if (match) return match;
    }
    const targetId = existingConsultation?.doctor_id || appointment?.doctor_id;
    if (targetId) {
      const match = doctors.find((d) => d.id === targetId || d.auth_id === targetId);
      if (match) return match;
    }
    if (currentUserId) {
      const match = doctors.find(
        (d) =>
          d.auth_id === currentUserId ||
          (currentUserEmail && d.email?.toLowerCase() === currentUserEmail.toLowerCase()),
      );
      if (match) return match;
    }
    return doctors[0] || null;
  }, [
    doctors,
    selectedDoctorId,
    existingConsultation?.doctor_id,
    appointment?.doctor_id,
    currentUserId,
    currentUserEmail,
  ]);

  const specialtyConfig = useMemo(() => {
    const spec =
      selectedSpecialty ||
      existingConsultation?.specialty_name ||
      currentDoctor?.specialty ||
      "Ginecología y Obstetricia";
    return getSpecialtyConfig(spec);
  }, [selectedSpecialty, existingConsultation?.specialty_name, currentDoctor?.specialty]);

  const currentSpecialtyTemplates = useMemo(() => {
    return getTemplatesForSpecialty(specialtyConfig.key);
  }, [specialtyConfig.key]);

  const currentSpecialtyPrescriptions = useMemo(() => {
    return getPrescriptionsForSpecialty(specialtyConfig.key);
  }, [specialtyConfig.key]);

  const handleDoctorChange = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    const doc = doctors.find((d) => d.id === doctorId);
    if (doc?.specialty) {
      setSelectedSpecialty(doc.specialty);
      toast.info(`Especialidad adaptada a: ${doc.specialty}`);
    }
  };

  return {
    selectedDoctorId,
    selectedSpecialty,
    setSelectedSpecialty,
    specialtyAnswers,
    setSpecialtyAnswers,
    currentDoctor,
    specialtyConfig,
    currentSpecialtyTemplates,
    currentSpecialtyPrescriptions,
    handleDoctorChange,
  };
}

function useConsultationGeneralStates(existingConsultation: Consultation | null | undefined) {
  const [visitType, setVisitType] = useState<VisitType>(
    existingConsultation?.visit_type || "CONTROL",
  );
  const [isFirstVisit, setIsFirstVisit] = useState(existingConsultation?.is_first_visit || false);
  const [subjectiveExam, setSubjectiveExam] = useState(existingConsultation?.subjective_exam ?? "");
  const [contactChannel, setContactChannel] = useState(existingConsultation?.contact_channel ?? "");

  return {
    visitType,
    setVisitType,
    isFirstVisit,
    setIsFirstVisit,
    subjectiveExam,
    setSubjectiveExam,
    contactChannel,
    setContactChannel,
  };
}

function useConsultationExamStates(existingConsultation: Consultation | null | undefined) {
  const [heightCm, setHeightCm] = useState(
    existingConsultation?.height_cm ? String(existingConsultation.height_cm) : "",
  );
  const [weightKg, setWeightKg] = useState(
    existingConsultation?.weight_kg ? String(existingConsultation.weight_kg) : "",
  );
  const [bloodPressure, setBloodPressure] = useState(existingConsultation?.blood_pressure ?? "");
  const [heartRate, setHeartRate] = useState(
    existingConsultation?.heart_rate ? String(existingConsultation.heart_rate) : "",
  );
  const [respiratoryRate, setRespiratoryRate] = useState(
    existingConsultation?.respiratory_rate ? String(existingConsultation.respiratory_rate) : "",
  );
  const [temperature, setTemperature] = useState(
    existingConsultation?.temperature ? String(existingConsultation.temperature) : "",
  );

  const [skin, setSkin] = useState(existingConsultation?.skin ?? "");
  const [headNeck, setHeadNeck] = useState(existingConsultation?.head_neck ?? "");
  const [breasts, setBreasts] = useState(existingConsultation?.breasts ?? "");
  const [abdomen, setAbdomen] = useState(existingConsultation?.abdomen ?? "");
  const [gynecological, setGynecological] = useState(existingConsultation?.gynecological ?? "");
  const [extremities, setExtremities] = useState(existingConsultation?.extremities ?? "");
  const [neurological, setNeurological] = useState(existingConsultation?.neurological ?? "");

  return {
    heightCm,
    setHeightCm,
    weightKg,
    setWeightKg,
    bloodPressure,
    setBloodPressure,
    heartRate,
    setHeartRate,
    respiratoryRate,
    setRespiratoryRate,
    temperature,
    setTemperature,
    skin,
    setSkin,
    headNeck,
    setHeadNeck,
    breasts,
    setBreasts,
    abdomen,
    setAbdomen,
    gynecological,
    setGynecological,
    extremities,
    setExtremities,
    neurological,
    setNeurological,
  };
}

function useConsultationTreatmentStates(existingConsultation: Consultation | null | undefined) {
  const [diagnosis, setDiagnosis] = useState(existingConsultation?.diagnosis ?? "");
  const [indications, setIndications] = useState(existingConsultation?.indications ?? "");
  const [complementaryExams, setComplementaryExams] = useState(
    existingConsultation?.complementary_exams ?? "",
  );
  const [plan, setPlan] = useState(existingConsultation?.plan ?? "");
  const [nextAppointmentDate, setNextAppointmentDate] = useState(
    existingConsultation?.next_appointment_date ?? "",
  );

  return {
    diagnosis,
    setDiagnosis,
    indications,
    setIndications,
    complementaryExams,
    setComplementaryExams,
    plan,
    setPlan,
    nextAppointmentDate,
    setNextAppointmentDate,
  };
}

function buildConsumablesPayload(
  commonQuantities: Record<string, string>,
  customConsumables: { id?: string; item_name: string; quantity: string; unit: string }[],
  dynamicConsumables: { name: string; defaultUnit: string }[],
) {
  const consumables: { item_name: string; quantity: number; unit: string | null }[] = [];

  Object.entries(commonQuantities).forEach(([name, qtyStr]) => {
    const qty = parseFloat(qtyStr);
    if (!isNaN(qty) && qty > 0) {
      const item = dynamicConsumables.find((c) => c.name === name);
      consumables.push({
        item_name: name,
        quantity: qty,
        unit: item?.defaultUnit ?? "U",
      });
    }
  });

  customConsumables.forEach((c) => {
    const qty = parseFloat(c.quantity);
    if (c.item_name.trim() && !isNaN(qty) && qty > 0) {
      consumables.push({
        item_name: c.item_name.trim(),
        quantity: qty,
        unit: c.unit || "U",
      });
    }
  });

  return consumables;
}

function buildConsultationDbPayload(params: {
  appointmentId: string;
  patientId: string;
  doctorId: string | null;
  visitType: VisitType;
  isFirstVisit: boolean;
  subjectiveExam: string;
  contactChannel: string;
  heightCm: string;
  weightKg: string;
  bmi: string;
  bloodPressure: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  skin: string;
  headNeck: string;
  breasts: string;
  abdomen: string;
  gynecological: string;
  extremities: string;
  neurological: string;
  specialtyRefs: Record<string, any>;
  diagnosis: string;
  indications: string;
  complementaryExams: string;
  plan: string;
  nextAppointmentDate: string;
  specialtyName: string;
  specialtyData: Record<string, any>;
  consumables: { item_name: string; quantity: number; unit: string | null }[];
}) {
  return {
    appointment_id: params.appointmentId,
    patient_id: params.patientId,
    doctor_id: params.doctorId,
    visit_type: params.visitType,
    is_first_visit: params.isFirstVisit,
    subjective_exam: params.subjectiveExam || null,
    contact_channel: params.contactChannel || null,

    height_cm: params.heightCm ? parseFloat(params.heightCm) : null,
    weight_kg: params.weightKg ? parseFloat(params.weightKg) : null,
    bmi: params.bmi ? parseFloat(params.bmi) : null,
    blood_pressure: params.bloodPressure || null,
    heart_rate: params.heartRate ? parseInt(params.heartRate) : null,
    respiratory_rate: params.respiratoryRate ? parseInt(params.respiratoryRate) : null,
    temperature: params.temperature ? parseFloat(params.temperature) : null,

    skin: params.skin || null,
    head_neck: params.headNeck || null,
    breasts: params.breasts || null,
    abdomen: params.abdomen || null,
    gynecological: params.gynecological || null,
    extremities: params.extremities || null,
    neurological: params.neurological || null,

    acetic_acid_test: params.specialtyRefs.acetic_acid_test || null,
    acetic_clock_position: params.specialtyRefs.acetic_clock_position || null,
    acetic_relative_position: params.specialtyRefs.acetic_relative_position || null,
    lugol_test: params.specialtyRefs.lugol_test || null,
    lugol_clock_position: params.specialtyRefs.lugol_clock_position || null,
    lugol_relative_position: params.specialtyRefs.lugol_relative_position || null,

    gestational_age: params.specialtyRefs.gestational_age || null,
    fetal_weight: params.specialtyRefs.fetal_weight
      ? parseFloat(params.specialtyRefs.fetal_weight)
      : null,
    obstetric_bp: params.specialtyRefs.obstetric_bp || null,
    uterine_height: params.specialtyRefs.uterine_height
      ? parseFloat(params.specialtyRefs.uterine_height)
      : null,
    presentation: params.specialtyRefs.presentation || null,
    fetal_heart_rate: params.specialtyRefs.fetal_heart_rate
      ? parseInt(params.specialtyRefs.fetal_heart_rate)
      : null,
    fetal_movements: params.specialtyRefs.fetal_movements || null,
    edema: params.specialtyRefs.edema || null,
    alarm_signs: params.specialtyRefs.alarm_signs || null,

    diagnosis: params.diagnosis || null,
    indications: params.indications || null,
    complementary_exams: params.complementaryExams || null,
    plan: params.plan || null,
    next_appointment_date: params.nextAppointmentDate || null,

    specialty_name: params.specialtyName,
    specialty_data: params.specialtyData,

    consumables: params.consumables,
  };
}

async function handleConsultationActionExport(
  actionType: "save" | "print" | "whatsapp",
  indications: string | null,
  patient: any,
  appointment: any,
  activeDoctor: any,
  selectedSpecialty: string,
  clinic: any,
) {
  if (!indications) return;

  if (actionType === "print") {
    const doctorName = activeDoctor?.full_name || "Médico Tratante";
    const doctorSpecialty = activeDoctor?.specialty || selectedSpecialty || undefined;

    await generateRecipePDF(
      {
        full_name: patient?.full_name || appointment.patient_name || "Paciente",
        document_id: patient?.document_id || null,
        birth_date: patient?.birth_date || null,
      },
      {
        created_at: new Date().toISOString(),
        indications,
      },
      doctorName,
      doctorSpecialty,
      activeDoctor?.university,
      activeDoctor?.mpps,
      activeDoctor?.cmc,
    );
  } else if (actionType === "whatsapp") {
    const doctorName = activeDoctor?.full_name || "Médico Tratante";

    sendRecipeViaWhatsApp({
      patientName: patient?.full_name || appointment.patient_name || "Paciente",
      patientPhone: patient?.phone || (appointment as any).patient_phone,
      consultationDate: new Date().toISOString(),
      indications,
      doctorName,
      clinicName: clinic?.name || "FemeSalud",
    });
  }
}

function applyClinicalTemplateValues(
  templateId: string,
  setSubjectiveExam: (v: string) => void,
  setBreasts: (v: string) => void,
  setAbdomen: (v: string) => void,
  setGynecological: (v: string) => void,
  setDiagnosis: (v: string) => void,
  setPlan: (v: string) => void,
) {
  if (!templateId) return;
  const t = CLINICAL_TEMPLATES.find((x) => x.id === templateId);
  if (t) {
    if (t.subjective) setSubjectiveExam(t.subjective);
    if (t.breasts) setBreasts(t.breasts);
    if (t.abdomen) setAbdomen(t.abdomen);
    if (t.gynecological) setGynecological(t.gynecological);
    if (t.diagnosis) setDiagnosis(t.diagnosis);
    if (t.plan) setPlan(t.plan);
    toast.success(`Plantilla "${t.name}" aplicada con éxito`);
  }
}

function applyPrescriptionTemplateValues(
  templateId: string,
  setIndications: (v: string) => void,
) {
  if (!templateId) return;
  const t = PRESCRIPTION_TEMPLATES.find((x) => x.id === templateId);
  if (t) {
    setIndications(t.indications);
    toast.success(`Receta "${t.name}" aplicada con éxito`);
  }
}

async function executeConsultationSave(params: {
  actionType: "save" | "print" | "whatsapp";
  appointment: any;
  isEdit: boolean;
  existingConsultation: Consultation | null | undefined;
  createConsultation: any;
  updateConsultation: any;
  updateAppointment: any;
  consumablesState: any;
  doctorSpecialtyState: any;
  examState: any;
  treatmentState: any;
  generalState: any;
  bmi: string;
  specialtyRefs: Record<string, any>;
  doctors: any[];
  currentUserId: string | null;
  patient: any;
  clinic: any;
  onOpenChange?: (v: boolean) => void;
}) {
  const {
    actionType,
    appointment,
    isEdit,
    existingConsultation,
    createConsultation,
    updateConsultation,
    updateAppointment,
    consumablesState,
    doctorSpecialtyState,
    examState,
    treatmentState,
    generalState,
    bmi,
    specialtyRefs,
    doctors,
    currentUserId,
    patient,
    clinic,
    onOpenChange,
  } = params;

  if (!appointment) return;

  try {
    const consumables = buildConsumablesPayload(
      consumablesState.commonQuantities,
      consumablesState.customConsumables,
      consumablesState.dynamicConsumables,
    );

    const payload = buildConsultationDbPayload({
      appointmentId: appointment.id,
      patientId: appointment.patient_id,
      doctorId:
        doctorSpecialtyState.selectedDoctorId ||
        doctorSpecialtyState.currentDoctor?.id ||
        appointment.doctor_id ||
        null,
      visitType: generalState.visitType,
      isFirstVisit: generalState.isFirstVisit,
      subjectiveExam: generalState.subjectiveExam,
      contactChannel: generalState.contactChannel,
      heightCm: examState.heightCm,
      weightKg: examState.weightKg,
      bmi,
      bloodPressure: examState.bloodPressure,
      heartRate: examState.heartRate,
      respiratoryRate: examState.respiratoryRate,
      temperature: examState.temperature,
      skin: examState.skin,
      headNeck: examState.headNeck,
      breasts: examState.breasts,
      abdomen: examState.abdomen,
      gynecological: examState.gynecological,
      extremities: examState.extremities,
      neurological: examState.neurological,
      specialtyRefs,
      diagnosis: treatmentState.diagnosis,
      indications: treatmentState.indications,
      complementaryExams: treatmentState.complementaryExams,
      plan: treatmentState.plan,
      nextAppointmentDate: treatmentState.nextAppointmentDate,
      specialtyName:
        doctorSpecialtyState.selectedSpecialty ||
        doctorSpecialtyState.currentDoctor?.specialty ||
        doctorSpecialtyState.specialtyConfig.name,
      specialtyData: doctorSpecialtyState.specialtyAnswers,
      consumables,
    });

    if (isEdit && existingConsultation?.id) {
      await updateConsultation.mutateAsync({
        id: existingConsultation.id,
        ...payload,
      });
      toast.success("Consulta actualizada con éxito");
    } else {
      await createConsultation.mutateAsync(payload);
      await updateAppointment.mutateAsync({
        id: appointment.id,
        status: "completada",
        price: appointment.price ?? undefined,
        reason: appointment.reason ?? undefined,
      });
      toast.success("Consulta registrada con éxito");
    }

    const activeDoctor =
      doctorSpecialtyState.currentDoctor ||
      doctors.find(
        (d) =>
          d.id ===
          (doctorSpecialtyState.selectedDoctorId ||
            existingConsultation?.doctor_id ||
            currentUserId),
      );

    await handleConsultationActionExport(
      actionType,
      payload.indications,
      patient,
      appointment,
      activeDoctor,
      doctorSpecialtyState.selectedSpecialty,
      clinic,
    );

    onOpenChange?.(false);
  } catch (err: any) {
    console.error("Consultation save error:", err);
    toast.error(err?.message || JSON.stringify(err) || "Error guardando la consulta");
  }
}

function getInitialSpecialtyRefs(existingConsultation?: Consultation | null): Record<string, any> {
  return {
    acetic_acid_test: existingConsultation?.acetic_acid_test ?? "",
    acetic_clock_position: existingConsultation?.acetic_clock_position ?? "",
    acetic_relative_position: existingConsultation?.acetic_relative_position ?? "",
    lugol_test: existingConsultation?.lugol_test ?? "",
    lugol_clock_position: existingConsultation?.lugol_clock_position ?? "",
    lugol_relative_position: existingConsultation?.lugol_relative_position ?? "",
    gestational_age: existingConsultation?.gestational_age ?? "",
    fetal_weight: existingConsultation?.fetal_weight ? String(existingConsultation.fetal_weight) : "",
    obstetric_bp: existingConsultation?.obstetric_bp ?? "",
    uterine_height: existingConsultation?.uterine_height
      ? String(existingConsultation.uterine_height)
      : "",
    presentation: existingConsultation?.presentation ?? "",
    fetal_heart_rate: existingConsultation?.fetal_heart_rate
      ? String(existingConsultation.fetal_heart_rate)
      : "",
    fetal_movements: existingConsultation?.fetal_movements ?? "",
    edema: existingConsultation?.edema ?? "",
    alarm_signs: existingConsultation?.alarm_signs ?? "",
  };
}

function createGestationalAgeRef(specialtyRefs: React.MutableRefObject<Record<string, any>>) {
  return {
    get current() {
      return specialtyRefs.current.gestational_age;
    },
    set current(val: any) {
      specialtyRefs.current.gestational_age = val;
    },
  };
}

function useCurrentUser() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUserId(data.user.id);
        setCurrentUserEmail(data.user.email || null);
      }
    });
  }, []);

  return { currentUserId, currentUserEmail };
}

function checkIsBusy(c1: boolean, c2: boolean, c3: boolean): boolean {
  return c1 || c2 || c3;
}

function getBmiString(bmiEval: ReturnType<typeof calculateBmiWithCategory>): string {
  return bmiEval?.bmiFormatted || "";
}

export function useConsultationFormState(
  appointment?: {
    id: string;
    patient_id: string;
    doctor_id?: string;
    patient_name?: string;
    price?: number | null;
    reason?: string | null;
  } | null,
  existingConsultation?: Consultation | null,
  onOpenChange?: (v: boolean) => void,
) {
  const createConsultation = useCreateConsultation();
  const updateConsultation = useUpdateConsultation();
  const updateAppointment = useUpdateAppointment();
  const busy = checkIsBusy(
    createConsultation.isPending,
    updateConsultation.isPending,
    updateAppointment.isPending,
  );
  const isEdit = Boolean(existingConsultation);

  const { data: patient } = usePatient(appointment?.patient_id);
  const { data: doctors = [] } = useDoctors();
  const { data: stocks = [] } = useStocks();
  const { data: clinic } = useClinicInfo();

  const { currentUserId, currentUserEmail } = useCurrentUser();

  const consumablesState = useConsultationConsumables(stocks, existingConsultation);
  const doctorSpecialtyState = useConsultationDoctorAndSpecialty(
    doctors,
    existingConsultation,
    appointment,
    currentUserId,
    currentUserEmail,
  );
  const generalState = useConsultationGeneralStates(existingConsultation);
  const examState = useConsultationExamStates(existingConsultation);
  const treatmentState = useConsultationTreatmentStates(existingConsultation);

  const initialSpecialtyRefs = useMemo(
    () => getInitialSpecialtyRefs(existingConsultation),
    [existingConsultation],
  );
  const specialtyRefs = useRef<Record<string, any>>(initialSpecialtyRefs);

  const gestationalAgeRef = useMemo(() => createGestationalAgeRef(specialtyRefs), []);

  const handleSpecialtyAnswerChange = (fieldId: string, value: any) => {
    doctorSpecialtyState.setSpecialtyAnswers((prev) => ({ ...prev, [fieldId]: value }));
    specialtyRefs.current[fieldId] = value;
  };

  const bmiEval = useMemo(() => {
    return calculateBmiWithCategory(examState.weightKg, examState.heightCm);
  }, [examState.weightKg, examState.heightCm]);

  const bmi = getBmiString(bmiEval);

  const applyClinicalTemplate = (templateId: string) => {
    applyClinicalTemplateValues(
      templateId,
      generalState.setSubjectiveExam,
      examState.setBreasts,
      examState.setAbdomen,
      examState.setGynecological,
      treatmentState.setDiagnosis,
      treatmentState.setPlan,
    );
  };

  const applyPrescriptionTemplate = (templateId: string) => {
    applyPrescriptionTemplateValues(templateId, treatmentState.setIndications);
  };

  const handleSave = (actionType: "save" | "print" | "whatsapp" = "save") => {
    return executeConsultationSave({
      actionType,
      appointment,
      isEdit,
      existingConsultation,
      createConsultation,
      updateConsultation,
      updateAppointment,
      consumablesState,
      doctorSpecialtyState,
      examState,
      treatmentState,
      generalState,
      bmi,
      specialtyRefs: specialtyRefs.current,
      doctors,
      currentUserId,
      patient,
      clinic,
      onOpenChange,
    });
  };

  return {
    busy,
    isEdit,
    patient,
    doctors,
    dynamicConsumables: consumablesState.dynamicConsumables,
    visitType: generalState.visitType,
    setVisitType: generalState.setVisitType,
    isFirstVisit: generalState.isFirstVisit,
    setIsFirstVisit: generalState.setIsFirstVisit,
    subjectiveExam: generalState.subjectiveExam,
    setSubjectiveExam: generalState.setSubjectiveExam,
    contactChannel: generalState.contactChannel,
    setContactChannel: generalState.setContactChannel,
    heightCm: examState.heightCm,
    setHeightCm: examState.setHeightCm,
    weightKg: examState.weightKg,
    setWeightKg: examState.setWeightKg,
    bloodPressure: examState.bloodPressure,
    setBloodPressure: examState.setBloodPressure,
    heartRate: examState.heartRate,
    setHeartRate: examState.setHeartRate,
    respiratoryRate: examState.respiratoryRate,
    setRespiratoryRate: examState.setRespiratoryRate,
    temperature: examState.temperature,
    setTemperature: examState.setTemperature,
    skin: examState.skin,
    setSkin: examState.setSkin,
    headNeck: examState.headNeck,
    setHeadNeck: examState.setHeadNeck,
    breasts: examState.breasts,
    setBreasts: examState.setBreasts,
    abdomen: examState.abdomen,
    setAbdomen: examState.setAbdomen,
    gynecological: examState.gynecological,
    setGynecological: examState.setGynecological,
    extremities: examState.extremities,
    setExtremities: examState.setExtremities,
    neurological: examState.neurological,
    setNeurological: examState.setNeurological,
    gestationalAgeRef,
    diagnosis: treatmentState.diagnosis,
    setDiagnosis: treatmentState.setDiagnosis,
    indications: treatmentState.indications,
    setIndications: treatmentState.setIndications,
    complementaryExams: treatmentState.complementaryExams,
    setComplementaryExams: treatmentState.setComplementaryExams,
    plan: treatmentState.plan,
    setPlan: treatmentState.setPlan,
    nextAppointmentDate: treatmentState.nextAppointmentDate,
    setNextAppointmentDate: treatmentState.setNextAppointmentDate,
    commonQuantities: consumablesState.commonQuantities,
    customConsumables: consumablesState.customConsumables,
    specialtyAnswers: doctorSpecialtyState.specialtyAnswers,
    selectedSpecialty: doctorSpecialtyState.selectedSpecialty,
    setSelectedSpecialty: doctorSpecialtyState.setSelectedSpecialty,
    selectedDoctorId: doctorSpecialtyState.selectedDoctorId,
    currentDoctor: doctorSpecialtyState.currentDoctor,
    specialtyConfig: doctorSpecialtyState.specialtyConfig,
    currentSpecialtyTemplates: doctorSpecialtyState.currentSpecialtyTemplates,
    currentSpecialtyPrescriptions: doctorSpecialtyState.currentSpecialtyPrescriptions,
    handleDoctorChange: doctorSpecialtyState.handleDoctorChange,
    handleSpecialtyAnswerChange,
    bmiEval,
    bmi,
    applyClinicalTemplate,
    applyPrescriptionTemplate,
    addCustomConsumable: consumablesState.addCustomConsumable,
    removeCustomConsumable: consumablesState.removeCustomConsumable,
    updateCustomConsumable: consumablesState.updateCustomConsumable,
    updateCommonQty: consumablesState.updateCommonQty,
    handleSave,
  };
}
