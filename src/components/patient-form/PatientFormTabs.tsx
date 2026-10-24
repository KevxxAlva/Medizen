import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";

export interface PatientIdTabProps {
  historia_number: string;
  setHistoriaNumber: (v: string) => void;
  full_name: string;
  setName: (v: string) => void;
  idPrefix: string;
  setIdPrefix: (v: string) => void;
  idNumber: string;
  setIdNumber: (v: string) => void;
  birth_date: string;
  setBirth: (v: string) => void;
  gender: string;
  setGender: (v: string) => void;
  blood_type: string;
  setBloodType: (v: string) => void;
  marital_status: string;
  setMaritalStatus: (v: string) => void;
  birthplace: string;
  setBirthplace: (v: string) => void;
  education_level: string;
  setEducationLevel: (v: string) => void;
  occupation: string;
  setOccupation: (v: string) => void;
  ethnicity: string;
  setEthnicity: (v: string) => void;
  phonePrefix: string;
  setPhonePrefix: (v: string) => void;
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  emergency_contact: string;
  setEmergencyContact: (v: string) => void;
  insurance_provider: string;
  setInsuranceProvider: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  first_visit_date: string;
  setFirstVisitDate: (v: string) => void;
  assigned_doctor_id: string;
  setDoctor: (v: string) => void;
  doctors: any[];
  STATUSES: string[];
  statusLabel: (s: string) => string;
  consultation_reason: string;
  setConsultationReason: (v: string) => void;
  current_illness: string;
  setCurrentIllness: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
}

function PatientBasicInfoFields({
  historia_number,
  setHistoriaNumber,
  full_name,
  setName,
  idPrefix,
  setIdPrefix,
  idNumber,
  setIdNumber,
  birth_date,
  setBirth,
  gender,
  setGender,
  blood_type,
  setBloodType,
  marital_status,
  setMaritalStatus,
}: Pick<
  PatientIdTabProps,
  | "historia_number"
  | "setHistoriaNumber"
  | "full_name"
  | "setName"
  | "idPrefix"
  | "setIdPrefix"
  | "idNumber"
  | "setIdNumber"
  | "birth_date"
  | "setBirth"
  | "gender"
  | "setGender"
  | "blood_type"
  | "setBloodType"
  | "marital_status"
  | "setMaritalStatus"
>) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="historia">Nº Historia</Label>
          <Input
            id="historia"
            value={historia_number}
            onChange={(e) => setHistoriaNumber(e.target.value)}
            placeholder="Auto-generado si queda vacío"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="name">Nombre completo</Label>
          <Input
            id="name"
            value={full_name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label>Tipo ID</Label>
          <Select value={idPrefix} onValueChange={setIdPrefix}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="V-">Venezolano (V-)</SelectItem>
              <SelectItem value="E-">Extranjero (E-)</SelectItem>
              <SelectItem value="P-">Pasaporte (P-)</SelectItem>
              <SelectItem value="none">Sin prefijo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="doc-number">Cédula / Pasaporte</Label>
          <Input
            id="doc-number"
            placeholder="Ej. 12345678 (o auto-genera S/C)"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="birth">Fecha de Nacimiento</Label>
          <Input
            id="birth"
            type="date"
            value={birth_date}
            onChange={(e) => setBirth(e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label>Género</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="Femenino">Femenino</SelectItem>
              <SelectItem value="Masculino">Masculino</SelectItem>
              <SelectItem value="Otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Grupo Sanguíneo</Label>
          <Select value={blood_type} onValueChange={setBloodType}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Seleccione..." />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="O+">O Positivo (O+)</SelectItem>
              <SelectItem value="O-">O Negativo (O-)</SelectItem>
              <SelectItem value="A+">A Positivo (A+)</SelectItem>
              <SelectItem value="A-">A Negativo (A-)</SelectItem>
              <SelectItem value="B+">B Positivo (B+)</SelectItem>
              <SelectItem value="B-">B Negativo (B-)</SelectItem>
              <SelectItem value="AB+">AB Positivo (AB+)</SelectItem>
              <SelectItem value="AB-">AB Negativo (AB-)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Estado Civil</Label>
          <Select value={marital_status} onValueChange={setMaritalStatus}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Seleccione..." />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="Soltera">Soltera</SelectItem>
              <SelectItem value="Casada">Casada</SelectItem>
              <SelectItem value="Concubinato">Concubinato / Unión Libre</SelectItem>
              <SelectItem value="Divorciada">Divorciada</SelectItem>
              <SelectItem value="Viuda">Viuda</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
}

function PatientDemographicsFields({
  birthplace,
  setBirthplace,
  education_level,
  setEducationLevel,
  occupation,
  setOccupation,
  phonePrefix,
  setPhonePrefix,
  phoneNumber,
  setPhoneNumber,
  email,
  setEmail,
  emergency_contact,
  setEmergencyContact,
  address,
  setAddress,
}: Pick<
  PatientIdTabProps,
  | "birthplace"
  | "setBirthplace"
  | "education_level"
  | "setEducationLevel"
  | "occupation"
  | "setOccupation"
  | "phonePrefix"
  | "setPhonePrefix"
  | "phoneNumber"
  | "setPhoneNumber"
  | "email"
  | "setEmail"
  | "emergency_contact"
  | "setEmergencyContact"
  | "address"
  | "setAddress"
>) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="birthplace">Lugar de Nacimiento</Label>
          <Input
            id="birthplace"
            value={birthplace}
            onChange={(e) => setBirthplace(e.target.value)}
            placeholder="Ciudad / Estado"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="education">Nivel de Instrucción</Label>
          <Input
            id="education"
            value={education_level}
            onChange={(e) => setEducationLevel(e.target.value)}
            placeholder="Ej. Universitaria, Bachiller..."
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="occupation">Ocupación / Oficio</Label>
          <Input
            id="occupation"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            placeholder="Ej. Educadora, Comerciante..."
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label>Teléfono</Label>
          <div className="flex gap-2">
            <Select value={phonePrefix} onValueChange={setPhonePrefix}>
              <SelectTrigger className="w-[85px] rounded-xl shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="+58">+58</SelectItem>
                <SelectItem value="+1">+1</SelectItem>
                <SelectItem value="+34">+34</SelectItem>
                <SelectItem value="+57">+57</SelectItem>
                <SelectItem value="+56">+56</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="4121234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="rounded-xl flex-1"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="paciente@correo.com"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="emergency">Contacto de Emergencia</Label>
          <Input
            id="emergency"
            value={emergency_contact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            placeholder="Nombre y teléfono familiar"
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="address">Dirección de Habitación</Label>
        <Textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Sector, calle, casa/apartamento..."
          className="rounded-xl min-h-[70px]"
        />
      </div>
    </>
  );
}

function PatientAdministrativeFields({
  insurance_provider,
  setInsuranceProvider,
  status,
  setStatus,
  first_visit_date,
  setFirstVisitDate,
  assigned_doctor_id,
  setDoctor,
  doctors,
  STATUSES,
  statusLabel,
  consultation_reason,
  setConsultationReason,
  current_illness,
  setCurrentIllness,
  notes,
  setNotes,
}: Pick<
  PatientIdTabProps,
  | "insurance_provider"
  | "setInsuranceProvider"
  | "status"
  | "setStatus"
  | "first_visit_date"
  | "setFirstVisitDate"
  | "assigned_doctor_id"
  | "setDoctor"
  | "doctors"
  | "STATUSES"
  | "statusLabel"
  | "consultation_reason"
  | "setConsultationReason"
  | "current_illness"
  | "setCurrentIllness"
  | "notes"
  | "setNotes"
>) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="insurance">Seguro Médico / Póliza</Label>
          <Input
            id="insurance"
            value={insurance_provider}
            onChange={(e) => setInsuranceProvider(e.target.value)}
            placeholder="Ej. Mercantil, Sanitas, Particular..."
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label>Estado</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="first_visit">Fecha Primera Consulta</Label>
          <Input
            id="first_visit"
            type="date"
            value={first_visit_date}
            onChange={(e) => setFirstVisitDate(e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Médico asignado</Label>
        <Select value={assigned_doctor_id} onValueChange={setDoctor}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Seleccione médico..." />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            {doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.full_name ?? d.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="reason">Motivo de Consulta</Label>
          <Textarea
            id="reason"
            value={consultation_reason}
            onChange={(e) => setConsultationReason(e.target.value)}
            placeholder="Razón por la cual asiste la paciente a consulta..."
            className="rounded-xl min-h-[70px]"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="illness">Enfermedad Actual</Label>
          <Textarea
            id="illness"
            value={current_illness}
            onChange={(e) => setCurrentIllness(e.target.value)}
            placeholder="Evolución clínica, síntomas y cronología..."
            className="rounded-xl min-h-[70px]"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notas y Observaciones Generales</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones adicionales, antecedentes relevantes..."
          className="rounded-xl min-h-[60px]"
        />
      </div>
    </>
  );
}

export function PatientIdTab(props: PatientIdTabProps) {
  return (
    <TabsContent value="id" className="grid gap-4 mt-0">
      <PatientBasicInfoFields {...props} />
      <PatientDemographicsFields {...props} />
      <PatientAdministrativeFields {...props} />
    </TabsContent>
  );
}

export function PatientFamilyTab({
  famMother, setFamMother,
  famFather, setFamFather,
  famSiblings, setFamSiblings,
  famChildren, setFamChildren,
}: {
  famMother: string; setFamMother: (v: string) => void;
  famFather: string; setFamFather: (v: string) => void;
  famSiblings: string; setFamSiblings: (v: string) => void;
  famChildren: string; setFamChildren: (v: string) => void;
}) {
  return (
    <TabsContent value="family" className="grid gap-4 mt-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="mother">Madre</Label>
          <Input
            id="mother"
            value={famMother}
            onChange={(e) => setFamMother(e.target.value)}
            placeholder="Patologías previas o causa de defunción"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="father">Padre</Label>
          <Input
            id="father"
            value={famFather}
            onChange={(e) => setFamFather(e.target.value)}
            placeholder="Patologías previas o causa de defunción"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="siblings">Hermanos</Label>
          <Input
            id="siblings"
            value={famSiblings}
            onChange={(e) => setFamSiblings(e.target.value)}
            placeholder="Antecedentes médicos o cantidad"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="children">Hijos</Label>
          <Input
            id="children"
            value={famChildren}
            onChange={(e) => setFamChildren(e.target.value)}
            placeholder="Antecedentes médicos o cantidad"
            className="rounded-xl"
          />
        </div>
      </div>
    </TabsContent>
  );
}

export function PatientPersonalTab({
  persAlcohol, setPersAlcohol,
  persDrugs, setPersDrugs,
  persTobacco, setPersTobacco,
  persBase, setPersBase,
  persAllergies, setPersAllergies,
  persMedications, setPersMedications,
  persSurgical, setPersSurgical,
  persTransfusions, setPersTransfusions,
}: {
  persAlcohol: string; setPersAlcohol: (v: string) => void;
  persDrugs: string; setPersDrugs: (v: string) => void;
  persTobacco: string; setPersTobacco: (v: string) => void;
  persBase: string; setPersBase: (v: string) => void;
  persAllergies: string; setPersAllergies: (v: string) => void;
  persMedications: string; setPersMedications: (v: string) => void;
  persSurgical: string; setPersSurgical: (v: string) => void;
  persTransfusions: string; setPersTransfusions: (v: string) => void;
}) {
  return (
    <TabsContent value="personal" className="grid gap-4 mt-0">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label>Alcohol</Label>
          <Select value={persAlcohol} onValueChange={setPersAlcohol}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="NIEGA">Niega</SelectItem>
              <SelectItem value="OCASIONAL">Ocasional</SelectItem>
              <SelectItem value="FRECUENTE">Frecuente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Drogas</Label>
          <Select value={persDrugs} onValueChange={setPersDrugs}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="NIEGA">Niega</SelectItem>
              <SelectItem value="OCASIONAL">Ocasional</SelectItem>
              <SelectItem value="FRECUENTE">Frecuente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Tabaco</Label>
          <Select value={persTobacco} onValueChange={setPersTobacco}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="NIEGA">Niega</SelectItem>
              <SelectItem value="OCASIONAL">Ocasional</SelectItem>
              <SelectItem value="FRECUENTE">Frecuente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="base">Patología de Base / Crónicas</Label>
          <Textarea
            id="base"
            value={persBase}
            onChange={(e) => setPersBase(e.target.value)}
            placeholder="Ej. Asma, Diabetes, Hipertensión..."
            className="rounded-xl min-h-[70px]"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="allergies">Alérgicos (Medicamentos / Alimentos)</Label>
          <Textarea
            id="allergies"
            value={persAllergies}
            onChange={(e) => setPersAllergies(e.target.value)}
            placeholder="Alergias conocidas (Ej. Penicilina, AINEs)..."
            className="rounded-xl min-h-[70px]"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="medications">Medicación Habitual Activa</Label>
          <Textarea
            id="medications"
            value={persMedications}
            onChange={(e) => setPersMedications(e.target.value)}
            placeholder="Fármacos y dosis de uso diario (Ej. Losartán 50mg OD)..."
            className="rounded-xl min-h-[70px]"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="surgical">Quirúrgicos / Hospitalizaciones</Label>
          <Textarea
            id="surgical"
            value={persSurgical}
            onChange={(e) => setPersSurgical(e.target.value)}
            placeholder="Intervenciones previas y año..."
            className="rounded-xl min-h-[70px]"
          />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="transfusions">
            Antecedentes Transfusionales e Inmunizaciones
          </Label>
          <Input
            id="transfusions"
            value={persTransfusions}
            onChange={(e) => setPersTransfusions(e.target.value)}
            placeholder="Ej. Niega transfusiones / Esquema de vacunación completo..."
            className="rounded-xl"
          />
        </div>
      </div>
    </TabsContent>
  );
}

export function PatientGynTab({
  gynMenarche, setGynMenarche,
  gynSexarche, setGynSexarche,
  gynCycle, setGynCycle,
  gynDismenorrea, setGynDismenorrea,
  gynNps, setGynNps,
  gynIts, setGynIts,
  gynCytology, setGynCytology,
  gynContraceptives, setGynContraceptives,
}: {
  gynMenarche: string; setGynMenarche: (v: string) => void;
  gynSexarche: string; setGynSexarche: (v: string) => void;
  gynCycle: string; setGynCycle: (v: string) => void;
  gynDismenorrea: string; setGynDismenorrea: (v: string) => void;
  gynNps: string; setGynNps: (v: string) => void;
  gynIts: string; setGynIts: (v: string) => void;
  gynCytology: string; setGynCytology: (v: string) => void;
  gynContraceptives: string; setGynContraceptives: (v: string) => void;
}) {
  return (
    <TabsContent value="gyn" className="grid gap-4 mt-0">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="menarche">Menarquía (Edad)</Label>
          <Input
            id="menarche"
            value={gynMenarche}
            onChange={(e) => setGynMenarche(e.target.value)}
            placeholder="Años"
            type="text"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sexarche">Sexarquía (Edad)</Label>
          <Input
            id="sexarche"
            value={gynSexarche}
            onChange={(e) => setGynSexarche(e.target.value)}
            placeholder="Años"
            type="text"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2 col-span-2">
          <Label htmlFor="cycle">Ciclo Menstrual</Label>
          <Input
            id="cycle"
            value={gynCycle}
            onChange={(e) => setGynCycle(e.target.value)}
            placeholder="Ej. 28/05 o Menopausia..."
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label>Dismenorrea</Label>
          <Select value={gynDismenorrea} onValueChange={setGynDismenorrea}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="NIEGA">Niega</SelectItem>
              <SelectItem value="SI">Sí</SelectItem>
              <SelectItem value="OCASIONAL">Ocasional</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="nps">NPS (Nº Parejas)</Label>
          <Input
            id="nps"
            value={gynNps}
            onChange={(e) => setGynNps(e.target.value)}
            placeholder="Nº"
            type="text"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="gynits">ITS</Label>
          <Input
            id="gynits"
            value={gynIts}
            onChange={(e) => setGynIts(e.target.value)}
            placeholder="Ej. VPH, Clamidia o Niega"
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="cytology">Citología (Antecedentes)</Label>
          <Textarea
            id="cytology"
            value={gynCytology}
            onChange={(e) => setGynCytology(e.target.value)}
            placeholder="Resultados previos, fecha de última toma..."
            className="rounded-xl min-h-[80px]"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contraceptives">Método Anticonceptivo</Label>
          <Input
            id="contraceptives"
            value={gynContraceptives}
            onChange={(e) => setGynContraceptives(e.target.value)}
            placeholder="Ej. ACO, T de cobre, implante..."
            className="rounded-xl"
          />
        </div>
      </div>
    </TabsContent>
  );
}

export function PatientObsTab({
  obsG, setObsG,
  obsP, setObsP,
  obsC, setObsC,
  obsA, setObsA,
  obsPig, setObsPig,
  obsEm, setObsEm,
  obsEe, setObsEe,
  obsFum, handleFumChange,
  obsEg, setObsEg,
  obsFpp, setObsFpp,
  obsNumConsultations, setObsNumConsultations,
  obsVaccines, setObsVaccines,
  obsComplications, setObsComplications,
}: {
  obsG: string; setObsG: (v: string) => void;
  obsP: string; setObsP: (v: string) => void;
  obsC: string; setObsC: (v: string) => void;
  obsA: string; setObsA: (v: string) => void;
  obsPig: string; setObsPig: (v: string) => void;
  obsEm: string; setObsEm: (v: string) => void;
  obsEe: string; setObsEe: (v: string) => void;
  obsFum: string; handleFumChange: (v: string) => void;
  obsEg: string; setObsEg: (v: string) => void;
  obsFpp: string; setObsFpp: (v: string) => void;
  obsNumConsultations: string; setObsNumConsultations: (v: string) => void;
  obsVaccines: string; setObsVaccines: (v: string) => void;
  obsComplications: string; setObsComplications: (v: string) => void;
}) {
  return (
    <TabsContent value="obs" className="grid gap-4 mt-0">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="obs_g">Gestas (G)</Label>
          <Input
            id="obs_g"
            value={obsG}
            onChange={(e) => setObsG(e.target.value)}
            placeholder="G"
            type="text"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="obs_p">Partos (P)</Label>
          <Input
            id="obs_p"
            value={obsP}
            onChange={(e) => setObsP(e.target.value)}
            placeholder="P"
            type="text"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="obs_c">Cesáreas (C)</Label>
          <Input
            id="obs_c"
            value={obsC}
            onChange={(e) => setObsC(e.target.value)}
            placeholder="C"
            type="text"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="obs_a">Abortos (A)</Label>
          <Input
            id="obs_a"
            value={obsA}
            onChange={(e) => setObsA(e.target.value)}
            placeholder="A"
            type="text"
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="obs_pig">PIG (Intervalo Gen.)</Label>
          <Input
            id="obs_pig"
            value={obsPig}
            onChange={(e) => setObsPig(e.target.value)}
            placeholder="Años o meses"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="obs_em">EM (Embarazos Múltiples)</Label>
          <Input
            id="obs_em"
            value={obsEm}
            onChange={(e) => setObsEm(e.target.value)}
            placeholder="Nº"
            type="text"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="obs_ee">EE (Ectópicos)</Label>
          <Input
            id="obs_ee"
            value={obsEe}
            onChange={(e) => setObsEe(e.target.value)}
            placeholder="Nº"
            type="text"
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="obs_fum">FUM (Fecha Última Menstruación)</Label>
          <Input
            id="obs_fum"
            type="date"
            value={obsFum}
            onChange={(e) => handleFumChange(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="obs_eg">EG (Edad Gestacional)</Label>
          <Input
            id="obs_eg"
            value={obsEg}
            onChange={(e) => setObsEg(e.target.value)}
            placeholder="Semanas + días (auto)"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="obs_fpp">FPP (Regla de Naegele)</Label>
          <Input
            id="obs_fpp"
            value={obsFpp}
            onChange={(e) => setObsFpp(e.target.value)}
            placeholder="FPP (auto)"
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="obs_consults">Nº Consultas Previas</Label>
          <Input
            id="obs_consults"
            value={obsNumConsultations}
            onChange={(e) => setObsNumConsultations(e.target.value)}
            placeholder="Nº"
            type="text"
            className="rounded-xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="obs_vaccines">Vacunas Aplicadas</Label>
          <Input
            id="obs_vaccines"
            value={obsVaccines}
            onChange={(e) => setObsVaccines(e.target.value)}
            placeholder="Ej. Antitetánica..."
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="complications">Complicaciones Obstétricas Previas</Label>
        <Textarea
          id="complications"
          value={obsComplications}
          onChange={(e) => setObsComplications(e.target.value)}
          placeholder="Ej. Preeclampsia, diabetes gestacional..."
          className="rounded-xl min-h-[60px]"
        />
      </div>
    </TabsContent>
  );
}
