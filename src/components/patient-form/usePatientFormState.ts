import { useState, useMemo } from "react";
import { type Patient } from "@/lib/api/patients";

export function getDocParts(docId: string | null) {
  const val = docId ?? "";
  if (val.startsWith("V-")) return ["V-", val.slice(2)];
  if (val.startsWith("E-")) return ["E-", val.slice(2)];
  if (val.startsWith("P-")) return ["P-", val.slice(2)];
  return ["none", val];
}

export function getPhoneParts(phone: string | null | undefined): [string, string] {
  if (!phone) return ["+58", ""];
  const parts = phone.split(" ");
  if (parts.length > 1 && parts[0].startsWith("+")) {
    return [parts[0], parts.slice(1).join(" ")];
  }
  return ["+58", phone];
}

const numToStr = (val: unknown) => (val !== undefined && val !== null ? String(val) : "");

export function calculateFppAndEg(val: string): { fpp?: string; eg?: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return {};
  const fumDate = new Date(val + "T00:00:00");
  if (isNaN(fumDate.getTime())) return {};

  const fppDate = new Date(fumDate);
  fppDate.setDate(fppDate.getDate() + 280);
  const fpp = fppDate.toISOString().slice(0, 10);

  const diffMs = Date.now() - fumDate.getTime();
  let eg: string | undefined;
  if (diffMs >= 0) {
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;
    if (weeks <= 44) {
      eg = `${weeks} sem + ${days} d`;
    }
  }
  return { fpp, eg };
}

export function getInitialPatientFormValues(
  patient?: Patient | null,
  defaultDoctor: string = "",
) {
  const [phonePrefix, phoneNumber] = getPhoneParts(patient?.phone);
  const [idPrefix, idNumber] = getDocParts(patient?.document_id ?? null);

  return {
    full_name: patient?.full_name ?? "",
    email: patient?.email ?? "",
    phonePrefix,
    phoneNumber,
    birth_date: patient?.birth_date ?? "",
    status: patient?.status ?? "nuevo",
    assigned_doctor_id: defaultDoctor,
    notes: patient?.notes ?? "",
    address: patient?.address ?? "",
    idPrefix,
    idNumber,
    historia_number: patient?.historia_number ?? "",
    first_visit_date: patient?.first_visit_date ?? new Date().toISOString().split("T")[0],
    gender: patient?.gender ?? "Femenino",
    blood_type: patient?.blood_type ?? "",
    emergency_contact: patient?.emergency_contact ?? "",
    insurance_provider: patient?.insurance_provider ?? "",
    marital_status: patient?.marital_status ?? "",
    birthplace: patient?.birthplace ?? "",
    education_level: patient?.education_level ?? "",
    occupation: patient?.occupation ?? "",
    ethnicity: patient?.ethnicity ?? "",
    consultation_reason: patient?.consultation_reason ?? "",
    current_illness: patient?.current_illness ?? "",
    famMother: patient?.family_history?.mother ?? "",
    famFather: patient?.family_history?.father ?? "",
    famSiblings: patient?.family_history?.siblings ?? "",
    famChildren: patient?.family_history?.children ?? "",
    persAlcohol: patient?.personal_history?.alcohol ?? "NIEGA",
    persDrugs: patient?.personal_history?.drugs ?? "NIEGA",
    persTobacco: patient?.personal_history?.tobacco ?? "NIEGA",
    persBase: patient?.personal_history?.base_pathology ?? "",
    persSurgical: patient?.personal_history?.surgical ?? "",
    persAllergies: patient?.personal_history?.allergies ?? "",
    persMedications: patient?.personal_history?.current_medications ?? "",
    persTransfusions: patient?.personal_history?.transfusions ?? "",
    gynMenarche: numToStr(patient?.gynecological_data?.menarche),
    gynSexarche: numToStr(patient?.gynecological_data?.sexarche),
    gynCycle: patient?.gynecological_data?.menstrual_cycle ?? "",
    gynDismenorrea: patient?.gynecological_data?.dysmenorrhea ?? "NIEGA",
    gynNps: numToStr(patient?.gynecological_data?.nps),
    gynIts: patient?.gynecological_data?.its ?? "",
    gynCytology: patient?.gynecological_data?.cytology ?? "",
    gynContraceptives: patient?.gynecological_data?.contraceptives ?? "",
    obsG: numToStr(patient?.obstetric_data?.g),
    obsP: numToStr(patient?.obstetric_data?.p),
    obsC: numToStr(patient?.obstetric_data?.c),
    obsA: numToStr(patient?.obstetric_data?.a),
    obsPig: patient?.obstetric_data?.pig ?? "",
    obsEm: numToStr(patient?.obstetric_data?.em),
    obsEe: numToStr(patient?.obstetric_data?.ee),
    obsComplications: patient?.obstetric_data?.complications ?? "",
    obsFum: patient?.obstetric_data?.fum ?? "",
    obsEg: patient?.obstetric_data?.eg ?? "",
    obsFpp: patient?.obstetric_data?.fpp ?? "",
    obsNumConsultations: numToStr(patient?.obstetric_data?.num_consultations),
    obsVaccines: patient?.obstetric_data?.vaccines ?? "",
  };
}

export function usePatientFormState(
  patient?: Patient | null,
  defaultDoctor: string = "",
) {
  const initial = useMemo(
    () => getInitialPatientFormValues(patient, defaultDoctor),
    [patient, defaultDoctor],
  );

  // General States
  const [full_name, setName] = useState(initial.full_name);
  const [email, setEmail] = useState(initial.email);
  const [phonePrefix, setPhonePrefix] = useState(initial.phonePrefix);
  const [phoneNumber, setPhoneNumber] = useState(initial.phoneNumber);
  const [birth_date, setBirth] = useState(initial.birth_date);
  const [status, setStatus] = useState(initial.status);
  const [assigned_doctor_id, setDoctor] = useState(initial.assigned_doctor_id);
  const [notes, setNotes] = useState(initial.notes);
  const [address, setAddress] = useState(initial.address);

  // Custom prefix states
  const [idPrefix, setIdPrefix] = useState(initial.idPrefix);
  const [idNumber, setIdNumber] = useState(initial.idNumber);

  // New Clinical States
  const [historia_number, setHistoriaNumber] = useState(initial.historia_number);
  const [first_visit_date, setFirstVisitDate] = useState(initial.first_visit_date);
  const [gender, setGender] = useState(initial.gender);
  const [blood_type, setBloodType] = useState(initial.blood_type);
  const [emergency_contact, setEmergencyContact] = useState(initial.emergency_contact);
  const [insurance_provider, setInsuranceProvider] = useState(initial.insurance_provider);
  const [marital_status, setMaritalStatus] = useState(initial.marital_status);
  const [birthplace, setBirthplace] = useState(initial.birthplace);
  const [education_level, setEducationLevel] = useState(initial.education_level);
  const [occupation, setOccupation] = useState(initial.occupation);
  const [ethnicity, setEthnicity] = useState(initial.ethnicity);
  const [consultation_reason, setConsultationReason] = useState(initial.consultation_reason);
  const [current_illness, setCurrentIllness] = useState(initial.current_illness);

  // Family History States
  const [famMother, setFamMother] = useState(initial.famMother);
  const [famFather, setFamFather] = useState(initial.famFather);
  const [famSiblings, setFamSiblings] = useState(initial.famSiblings);
  const [famChildren, setFamChildren] = useState(initial.famChildren);

  // Personal History States
  const [persAlcohol, setPersAlcohol] = useState(initial.persAlcohol);
  const [persDrugs, setPersDrugs] = useState(initial.persDrugs);
  const [persTobacco, setPersTobacco] = useState(initial.persTobacco);
  const [persBase, setPersBase] = useState(initial.persBase);
  const [persSurgical, setPersSurgical] = useState(initial.persSurgical);
  const [persAllergies, setPersAllergies] = useState(initial.persAllergies);
  const [persMedications, setPersMedications] = useState(initial.persMedications);
  const [persTransfusions, setPersTransfusions] = useState(initial.persTransfusions);

  // Gynecological Data States
  const [gynMenarche, setGynMenarche] = useState(initial.gynMenarche);
  const [gynSexarche, setGynSexarche] = useState(initial.gynSexarche);
  const [gynCycle, setGynCycle] = useState(initial.gynCycle);
  const [gynDismenorrea, setGynDismenorrea] = useState(initial.gynDismenorrea);
  const [gynNps, setGynNps] = useState(initial.gynNps);
  const [gynIts, setGynIts] = useState(initial.gynIts);
  const [gynCytology, setGynCytology] = useState(initial.gynCytology);
  const [gynContraceptives, setGynContraceptives] = useState(initial.gynContraceptives);

  // Obstetric Data States
  const [obsG, setObsG] = useState(initial.obsG);
  const [obsP, setObsP] = useState(initial.obsP);
  const [obsC, setObsC] = useState(initial.obsC);
  const [obsA, setObsA] = useState(initial.obsA);
  const [obsPig, setObsPig] = useState(initial.obsPig);
  const [obsEm, setObsEm] = useState(initial.obsEm);
  const [obsEe, setObsEe] = useState(initial.obsEe);
  const [obsComplications, setObsComplications] = useState(initial.obsComplications);
  const [obsFum, setObsFum] = useState(initial.obsFum);
  const [obsEg, setObsEg] = useState(initial.obsEg);
  const [obsFpp, setObsFpp] = useState(initial.obsFpp);
  const [obsNumConsultations, setObsNumConsultations] = useState(initial.obsNumConsultations);
  const [obsVaccines, setObsVaccines] = useState(initial.obsVaccines);

  const handleFumChange = (val: string) => {
    setObsFum(val);
    const { fpp, eg } = calculateFppAndEg(val);
    if (fpp) setObsFpp(fpp);
    if (eg) setObsEg(eg);
  };

  return {
    full_name, setName,
    email, setEmail,
    phonePrefix, setPhonePrefix,
    phoneNumber, setPhoneNumber,
    birth_date, setBirth,
    status, setStatus,
    assigned_doctor_id, setDoctor,
    notes, setNotes,
    address, setAddress,
    idPrefix, setIdPrefix,
    idNumber, setIdNumber,
    historia_number, setHistoriaNumber,
    first_visit_date, setFirstVisitDate,
    gender, setGender,
    blood_type, setBloodType,
    emergency_contact, setEmergencyContact,
    insurance_provider, setInsuranceProvider,
    marital_status, setMaritalStatus,
    birthplace, setBirthplace,
    education_level, setEducationLevel,
    occupation, setOccupation,
    ethnicity, setEthnicity,
    consultation_reason, setConsultationReason,
    current_illness, setCurrentIllness,
    famMother, setFamMother,
    famFather, setFamFather,
    famSiblings, setFamSiblings,
    famChildren, setFamChildren,
    persAlcohol, setPersAlcohol,
    persDrugs, setPersDrugs,
    persTobacco, setPersTobacco,
    persBase, setPersBase,
    persSurgical, setPersSurgical,
    persAllergies, setPersAllergies,
    persMedications, setPersMedications,
    persTransfusions, setPersTransfusions,
    gynMenarche, setGynMenarche,
    gynSexarche, setGynSexarche,
    gynCycle, setGynCycle,
    gynDismenorrea, setGynDismenorrea,
    gynNps, setGynNps,
    gynIts, setGynIts,
    gynCytology, setGynCytology,
    gynContraceptives, setGynContraceptives,
    obsG, setObsG,
    obsP, setObsP,
    obsC, setObsC,
    obsA, setObsA,
    obsPig, setObsPig,
    obsEm, setObsEm,
    obsEe, setObsEe,
    obsComplications, setObsComplications,
    obsFum, setObsFum,
    obsEg, setObsEg,
    obsFpp, setObsFpp,
    obsNumConsultations, setObsNumConsultations,
    obsVaccines, setObsVaccines,
    handleFumChange,
  };
}
