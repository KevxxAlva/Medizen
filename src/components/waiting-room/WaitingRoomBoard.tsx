import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  MessageCircle,
  ReceiptText,
  RotateCcw,
  Sparkles,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppointmentWithPatient } from "@/lib/api/appointments";
import type { InvoiceRecord } from "@/components/finance/useSalesInvoices";
import { timeOnly } from "@/components/agenda/agenda-helpers";
import {
  formatWaitMinutes,
  getInvoiceStatusForApp,
  openAppointmentWhatsAppReminder,
  type StageRecord,
  type TriageStage,
  type WaitingRoomColumns,
} from "./waitingRoomHelpers";

function PorLlegarColumn({
  items,
  patientContactMap,
  doctorMap,
  selectedDate,
  clinicName,
  onStageChange,
}: {
  items: AppointmentWithPatient[];
  patientContactMap: Map<string, { phone: string | null; doc: string | null }>;
  doctorMap: Map<string, string>;
  selectedDate: string;
  clinicName: string;
  onStageChange: (app: AppointmentWithPatient, nextStage: TriageStage) => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-muted/20 p-3 flex flex-col gap-3 min-h-[380px]">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
            1. Citados / Por Llegar
          </h2>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
          {items.length}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <Calendar className="h-7 w-7 opacity-30 mb-2" />
            <p className="text-xs font-medium">Sin pacientes pendientes por llegar</p>
          </div>
        ) : (
          items.map((app) => {
            const contact = patientContactMap.get(app.patient_id);
            const docLabel = doctorMap.get(app.doctor_id) || "Especialista";
            return (
              <div
                key={app.id}
                className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground leading-tight">
                      {app.patient_name}
                    </p>
                    {contact?.doc && (
                      <p className="text-[11px] text-muted-foreground font-mono">
                        CI: {contact.doc}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-lg bg-primary/10 text-primary shrink-0">
                    {timeOnly(app.scheduled_at)}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p className="font-semibold text-foreground/85 truncate">
                    {app.reason || "Consulta Médica"}
                  </p>
                  <p className="truncate">Dr(a). {docLabel}</p>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      openAppointmentWhatsAppReminder({
                        patientName: app.patient_name || "Paciente",
                        phone: contact?.phone,
                        dateYmd: selectedDate,
                        timeStr: timeOnly(app.scheduled_at),
                        doctorName: docLabel,
                        reason: app.reason,
                        clinicName,
                      })
                    }
                    className="h-8 px-2.5 rounded-xl text-[11px] font-bold gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                    title="Enviar recordatorio de cita por WhatsApp"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => onStageChange(app, "en_espera")}
                    className="h-8 flex-1 rounded-xl text-[11px] font-bold gap-1"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Llegó
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function EnEsperaColumn({
  items,
  doctorMap,
  sharedStages,
  nowMs,
  onStageChange,
}: {
  items: AppointmentWithPatient[];
  doctorMap: Map<string, string>;
  sharedStages: Record<string, StageRecord>;
  nowMs: number;
  onStageChange: (app: AppointmentWithPatient, nextStage: TriageStage) => void;
}) {
  return (
    <section className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.03] p-3 flex flex-col gap-3 min-h-[380px]">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
            2. En Sala de Espera
          </h2>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
          {items.length}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <Clock className="h-7 w-7 opacity-30 mb-2" />
            <p className="text-xs font-medium">Ningún paciente esperando en sala</p>
          </div>
        ) : (
          items.map((app) => {
            const docLabel = doctorMap.get(app.doctor_id) || "Especialista";
            const waitLabel = formatWaitMinutes(sharedStages[app.id]?.arrivedAt, nowMs);
            return (
              <div
                key={app.id}
                className="rounded-2xl border border-amber-500/30 bg-card p-3.5 shadow-2xs flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground leading-tight">
                      {app.patient_name}
                    </p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {waitLabel || "Esperando turno"}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-muted text-muted-foreground">
                    {timeOnly(app.scheduled_at)}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p className="font-semibold text-foreground/85 truncate">
                    {app.reason || "Consulta Médica"}
                  </p>
                  <p className="truncate">Dr(a). {docLabel}</p>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Devolver a Por Llegar"
                    onClick={() => onStageChange(app, "por_llegar")}
                    className="h-8 px-2 rounded-xl text-xs text-muted-foreground"
                    title="Devolver a Por Llegar"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onStageChange(app, "en_consulta")}
                    className="h-8 flex-1 rounded-xl text-[11px] font-bold gap-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Pasar a Consulta
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function EnConsultaColumn({
  items,
  doctorMap,
  onStageChange,
  onOpenConsultation,
}: {
  items: AppointmentWithPatient[];
  doctorMap: Map<string, string>;
  onStageChange: (app: AppointmentWithPatient, nextStage: TriageStage) => void;
  onOpenConsultation: (app: AppointmentWithPatient) => void;
}) {
  return (
    <section className="rounded-2xl border border-purple-500/25 bg-purple-500/[0.03] p-3 flex flex-col gap-3 min-h-[380px]">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
            3. En Consultorio
          </h2>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400">
          {items.length}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <Stethoscope className="h-7 w-7 opacity-30 mb-2" />
            <p className="text-xs font-medium">Sin consultas en curso ahora mismo</p>
          </div>
        ) : (
          items.map((app) => {
            const docLabel = doctorMap.get(app.doctor_id) || "Especialista";
            return (
              <div
                key={app.id}
                className="rounded-2xl border border-purple-500/35 bg-card p-3.5 shadow-2xs flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground leading-tight">
                      {app.patient_name}
                    </p>
                    <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 mt-0.5">
                      <Sparkles className="h-3 w-3" />
                      Siendo atendido(a)
                    </p>
                  </div>
                  {app.price ? (
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-300">
                      ${Number(app.price).toFixed(2)}
                    </span>
                  ) : null}
                </div>

                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p className="font-semibold text-foreground/85 truncate">
                    {app.reason || "Consulta Médica"}
                  </p>
                  <p className="truncate">Dr(a). {docLabel}</p>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Devolver a Sala de Espera"
                    onClick={() => onStageChange(app, "en_espera")}
                    className="h-8 px-2 rounded-xl text-xs text-muted-foreground"
                    title="Devolver a Sala de Espera"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onOpenConsultation(app)}
                    className="h-8 flex-1 rounded-xl text-[11px] font-bold gap-1 bg-primary text-primary-foreground"
                  >
                    <Stethoscope className="h-3.5 w-3.5" />
                    Abrir / Finalizar Consulta
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function AtendidosColumn({
  items,
  doctorMap,
  facturas,
  onGoToSales,
}: {
  items: AppointmentWithPatient[];
  doctorMap: Map<string, string>;
  facturas: InvoiceRecord[];
  onGoToSales: () => void;
}) {
  return (
    <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.03] p-3 flex flex-col gap-3 min-h-[380px]">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
            4. Atendidos / Caja
          </h2>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          {items.length}
        </span>
      </div>

      <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <CheckCircle2 className="h-7 w-7 opacity-30 mb-2" />
            <p className="text-xs font-medium">Aún no hay consultas completadas en esta fecha</p>
          </div>
        ) : (
          items.map((app) => {
            const docLabel = doctorMap.get(app.doctor_id) || "Especialista";
            const inv = getInvoiceStatusForApp(app, facturas);
            const amount = inv ? inv.total : Number(app.price || 0);
            const isPaid = inv?.isPaid ?? false;

            return (
              <div
                key={app.id}
                className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground leading-tight">
                      {app.patient_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      Dr(a). {docLabel}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0 flex items-center gap-1",
                      isPaid
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
                    )}
                  >
                    {isPaid ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Pagada
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3" /> Pendiente
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs bg-muted/50 px-2.5 py-1.5 rounded-xl">
                  <span className="truncate font-medium text-muted-foreground">
                    {app.reason || "Consulta"}
                  </span>
                  <span className="font-extrabold text-foreground shrink-0 ml-2">
                    ${amount.toFixed(2)}
                  </span>
                </div>

                {!isPaid && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onGoToSales}
                    className="h-8 rounded-xl text-[11px] font-bold gap-1.5 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                  >
                    <ReceiptText className="h-3.5 w-3.5" />
                    Confirmar Pago en Ventas
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

interface WaitingRoomBoardProps {
  columns: WaitingRoomColumns;
  patientContactMap: Map<string, { phone: string | null; doc: string | null }>;
  doctorMap: Map<string, string>;
  sharedStages: Record<string, StageRecord>;
  facturas: InvoiceRecord[];
  selectedDate: string;
  clinicName: string;
  nowMs: number;
  onStageChange: (app: AppointmentWithPatient, nextStage: TriageStage) => void;
  onOpenConsultation: (app: AppointmentWithPatient) => void;
  onGoToSales: () => void;
}

export function WaitingRoomBoard({
  columns,
  patientContactMap,
  doctorMap,
  sharedStages,
  facturas,
  selectedDate,
  clinicName,
  nowMs,
  onStageChange,
  onOpenConsultation,
  onGoToSales,
}: WaitingRoomBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1">
      <PorLlegarColumn
        items={columns.porLlegar}
        patientContactMap={patientContactMap}
        doctorMap={doctorMap}
        selectedDate={selectedDate}
        clinicName={clinicName}
        onStageChange={onStageChange}
      />
      <EnEsperaColumn
        items={columns.enEspera}
        doctorMap={doctorMap}
        sharedStages={sharedStages}
        nowMs={nowMs}
        onStageChange={onStageChange}
      />
      <EnConsultaColumn
        items={columns.enConsulta}
        doctorMap={doctorMap}
        onStageChange={onStageChange}
        onOpenConsultation={onOpenConsultation}
      />
      <AtendidosColumn
        items={columns.atendidos}
        doctorMap={doctorMap}
        facturas={facturas}
        onGoToSales={onGoToSales}
      />
    </div>
  );
}
