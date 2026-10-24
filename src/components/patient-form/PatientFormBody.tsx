import React from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  PatientIdTab,
  PatientFamilyTab,
  PatientPersonalTab,
  PatientGynTab,
  PatientObsTab,
} from "./PatientFormTabs";

export interface PatientFormBodyProps {
  formState: any;
  doctors: any[];
  STATUSES: string[];
  statusLabel: (s: string) => string;
  busy: boolean;
  isEdit: boolean;
  onCancel: () => void;
}

export function PatientFormBody({
  formState,
  doctors,
  STATUSES,
  statusLabel,
  busy,
  isEdit,
  onCancel,
}: PatientFormBodyProps) {
  return (
    <>
      <Tabs defaultValue="id" className="flex-1 flex flex-col min-h-0">
        <TabsList className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full bg-muted/60 p-1.5 rounded-2xl mb-4">
          <TabsTrigger
            value="id"
            className="rounded-xl font-medium text-xs px-3 py-1.5 shrink-0 sm:shrink sm:flex-1 whitespace-nowrap"
          >
            Identificación
          </TabsTrigger>
          <TabsTrigger
            value="family"
            className="rounded-xl font-medium text-xs px-3 py-1.5 shrink-0 sm:shrink sm:flex-1 whitespace-nowrap"
          >
            Ant. Familiares
          </TabsTrigger>
          <TabsTrigger
            value="personal"
            className="rounded-xl font-medium text-xs px-3 py-1.5 shrink-0 sm:shrink sm:flex-1 whitespace-nowrap"
          >
            Ant. Personales
          </TabsTrigger>
          <TabsTrigger
            value="gyn"
            className="rounded-xl font-medium text-xs px-3 py-1.5 shrink-0 sm:shrink sm:flex-1 whitespace-nowrap"
          >
            Ginecológicos
          </TabsTrigger>
          <TabsTrigger
            value="obs"
            className="rounded-xl font-medium text-xs px-3 py-1.5 shrink-0 sm:shrink sm:flex-1 whitespace-nowrap"
          >
            Obstétricos
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 pr-2">
          <div className="py-1">
            <PatientIdTab
              historia_number={formState.historia_number}
              setHistoriaNumber={formState.setHistoriaNumber}
              full_name={formState.full_name}
              setName={formState.setName}
              idPrefix={formState.idPrefix}
              setIdPrefix={formState.setIdPrefix}
              idNumber={formState.idNumber}
              setIdNumber={formState.setIdNumber}
              birth_date={formState.birth_date}
              setBirth={formState.setBirth}
              gender={formState.gender}
              setGender={formState.setGender}
              blood_type={formState.blood_type}
              setBloodType={formState.setBloodType}
              marital_status={formState.marital_status}
              setMaritalStatus={formState.setMaritalStatus}
              birthplace={formState.birthplace}
              setBirthplace={formState.setBirthplace}
              education_level={formState.education_level}
              setEducationLevel={formState.setEducationLevel}
              occupation={formState.occupation}
              setOccupation={formState.setOccupation}
              ethnicity={formState.ethnicity}
              setEthnicity={formState.setEthnicity}
              phonePrefix={formState.phonePrefix}
              setPhonePrefix={formState.setPhonePrefix}
              phoneNumber={formState.phoneNumber}
              setPhoneNumber={formState.setPhoneNumber}
              email={formState.email}
              setEmail={formState.setEmail}
              address={formState.address}
              setAddress={formState.setAddress}
              emergency_contact={formState.emergency_contact}
              setEmergencyContact={formState.setEmergencyContact}
              insurance_provider={formState.insurance_provider}
              setInsuranceProvider={formState.setInsuranceProvider}
              status={formState.status}
              setStatus={formState.setStatus}
              first_visit_date={formState.first_visit_date}
              setFirstVisitDate={formState.setFirstVisitDate}
              assigned_doctor_id={formState.assigned_doctor_id}
              setDoctor={formState.setDoctor}
              doctors={doctors}
              STATUSES={STATUSES}
              statusLabel={statusLabel}
              consultation_reason={formState.consultation_reason}
              setConsultationReason={formState.setConsultationReason}
              current_illness={formState.current_illness}
              setCurrentIllness={formState.setCurrentIllness}
              notes={formState.notes}
              setNotes={formState.setNotes}
            />

            <PatientFamilyTab
              famMother={formState.famMother}
              setFamMother={formState.setFamMother}
              famFather={formState.famFather}
              setFamFather={formState.setFamFather}
              famSiblings={formState.famSiblings}
              setFamSiblings={formState.setFamSiblings}
              famChildren={formState.famChildren}
              setFamChildren={formState.setFamChildren}
            />

            <PatientPersonalTab
              persAlcohol={formState.persAlcohol}
              setPersAlcohol={formState.setPersAlcohol}
              persDrugs={formState.persDrugs}
              setPersDrugs={formState.setPersDrugs}
              persTobacco={formState.persTobacco}
              setPersTobacco={formState.setPersTobacco}
              persBase={formState.persBase}
              setPersBase={formState.setPersBase}
              persAllergies={formState.persAllergies}
              setPersAllergies={formState.setPersAllergies}
              persMedications={formState.persMedications}
              setPersMedications={formState.setPersMedications}
              persSurgical={formState.persSurgical}
              setPersSurgical={formState.setPersSurgical}
              persTransfusions={formState.persTransfusions}
              setPersTransfusions={formState.setPersTransfusions}
            />

            <PatientGynTab
              gynMenarche={formState.gynMenarche}
              setGynMenarche={formState.setGynMenarche}
              gynSexarche={formState.gynSexarche}
              setGynSexarche={formState.setGynSexarche}
              gynCycle={formState.gynCycle}
              setGynCycle={formState.setGynCycle}
              gynDismenorrea={formState.gynDismenorrea}
              setGynDismenorrea={formState.setGynDismenorrea}
              gynNps={formState.gynNps}
              setGynNps={formState.setGynNps}
              gynIts={formState.gynIts}
              setGynIts={formState.setGynIts}
              gynCytology={formState.gynCytology}
              setGynCytology={formState.setGynCytology}
              gynContraceptives={formState.gynContraceptives}
              setGynContraceptives={formState.setGynContraceptives}
            />

            <PatientObsTab
              obsG={formState.obsG}
              setObsG={formState.setObsG}
              obsP={formState.obsP}
              setObsP={formState.setObsP}
              obsC={formState.obsC}
              setObsC={formState.setObsC}
              obsA={formState.obsA}
              setObsA={formState.setObsA}
              obsPig={formState.obsPig}
              setObsPig={formState.setObsPig}
              obsEm={formState.obsEm}
              setObsEm={formState.setObsEm}
              obsEe={formState.obsEe}
              setObsEe={formState.setObsEe}
              obsFum={formState.obsFum}
              handleFumChange={formState.handleFumChange}
              obsEg={formState.obsEg}
              setObsEg={formState.setObsEg}
              obsFpp={formState.obsFpp}
              setObsFpp={formState.setObsFpp}
              obsNumConsultations={formState.obsNumConsultations}
              setObsNumConsultations={formState.setObsNumConsultations}
              obsVaccines={formState.obsVaccines}
              setObsVaccines={formState.setObsVaccines}
              obsComplications={formState.obsComplications}
              setObsComplications={formState.setObsComplications}
            />
          </div>
        </ScrollArea>
      </Tabs>

      <DialogFooter className="border-t pt-4 mt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl">
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={busy}
          className="bg-gradient-to-r from-mauve to-mauve-soft text-primary-foreground hover:opacity-95 rounded-xl px-6"
        >
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Guardar cambios" : "Crear paciente"}
        </Button>
      </DialogFooter>
    </>
  );
}
