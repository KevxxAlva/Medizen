import { useState } from "react";
import { useForm, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Service,
  ServiceInsert,
  useCreateService,
  useUpdateService,
  useSpecialties,
} from "@/lib/api/services";
import {
  Stethoscope,
  ArrowLeft,
  DollarSign,
  FileText,
  Hash,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  WorkspaceHeaderTitle,
  WorkspaceStepHeader,
  WorkspaceStepper,
  WorkspaceStepperFooter,
} from "@/components/ui/workspace-stepper";
import { cn } from "@/lib/utils";

interface ServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  defaultSpecialtyId?: string | number | null;
  isDoctorOnly?: boolean;
}

interface SavedServiceSummary {
  nombre_servicio: string;
  costo_base: number;
  codigo_medico?: string | null;
  descripcion?: string | null;
  specialtyName: string;
}

const SERVICE_STEPS = [
  { id: "identity", title: "Identificación y Especialidad", subtitle: "Nombre, código y rama médica" },
  { id: "pricing", title: "Tarifa y Descripción", subtitle: "Costo base ($) y detalle clínico" },
];

const QUICK_PRICES = [20, 25, 30, 35, 40, 50, 60, 80];

function ServiceSuccessView({
  savedSummary,
  isEdit,
  onResetForNew,
  onClose,
}: {
  savedSummary: SavedServiceSummary;
  isEdit: boolean;
  onResetForNew: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
      <style>{`
        @keyframes medizen-serv-draw { 0% { stroke-dashoffset: 280; opacity: 0; transform: translateY(5px); } 50% { opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 1; transform: translateY(0); } }
        @keyframes medizen-serv-seal-pop { 0% { transform: scale(0.35); opacity: 0; } 70% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes medizen-serv-check { 0% { stroke-dashoffset: 60; } 100% { stroke-dashoffset: 0; } }
        .medizen-serv-stroke { stroke-dasharray: 280; stroke-dashoffset: 280; animation: medizen-serv-draw 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .medizen-serv-seal { transform-origin: 72px 70px; opacity: 0; animation: medizen-serv-seal-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.35s forwards; }
        .medizen-serv-check-path { stroke-dasharray: 60; stroke-dashoffset: 60; animation: medizen-serv-check 0.38s cubic-bezier(0.22, 1, 0.36, 1) 0.52s forwards; }
      `}</style>

      <div className="relative flex items-center justify-center mb-5">
        <div className="absolute h-28 w-28 rounded-full bg-emerald-500/15 animate-ping [animation-duration:1.8s]" />
        <div className="absolute h-24 w-24 rounded-full bg-primary/5" />
        <svg className="h-28 w-28 relative z-10" viewBox="0 0 100 100" fill="none">
          <rect x="18" y="16" width="54" height="64" rx="12" className="fill-primary/10 stroke-primary medizen-serv-stroke" strokeWidth="3.5" />
          <circle cx="45" cy="37" r="9" className="stroke-primary medizen-serv-stroke" strokeWidth="3.2" />
          <path d="M45 32.5V41.5M40.5 37H49.5" className="stroke-primary medizen-serv-stroke" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M30 55H60M30 64H48" className="stroke-primary/70 medizen-serv-stroke" strokeWidth="3" strokeLinecap="round" />
          <g className="medizen-serv-seal">
            <circle cx="72" cy="70" r="18" className="fill-emerald-500 stroke-card" strokeWidth="4" />
            <path d="M63.5 70.5L69 76L80.5 64" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="medizen-serv-check-path" />
          </g>
        </svg>
      </div>

      <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 rounded-full">
        {isEdit ? "Servicio Médico Actualizado" : "Servicio Incorporado al Catálogo"}
      </span>
      <h3 className="text-xl sm:text-2xl font-black text-foreground mt-3">
        {isEdit ? "¡Tarifa y Datos Actualizados!" : "¡Servicio Médico Registrado!"}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-md">
        El procedimiento <strong className="text-foreground">{savedSummary.nombre_servicio}</strong> ya está disponible para agendamiento de citas y facturación automática.
      </p>

      <div className="mt-6 w-full max-w-md rounded-2xl border border-border/80 bg-muted/30 p-4 text-left shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-foreground truncate">{savedSummary.nombre_servicio}</p>
            <p className="text-[11px] text-muted-foreground truncate">{savedSummary.specialtyName}</p>
          </div>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-xl shrink-0">
            ${savedSummary.costo_base.toFixed(2)} USD
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Código Médico</span>
            <p className="font-mono font-bold text-foreground mt-0.5">{savedSummary.codigo_medico?.trim() || "Automático"}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Disponibilidad</span>
            <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Activo en Agenda y Caja</p>
          </div>
        </div>

        {savedSummary.descripcion?.trim() && (
          <div className="pt-2 border-t border-border/50 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Descripción</span>
            <p className="text-muted-foreground mt-0.5 line-clamp-2">{savedSummary.descripcion}</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 w-full max-w-md">
        {!isEdit && (
          <Button type="button" variant="outline" onClick={onResetForNew} className="w-full sm:w-auto h-10 rounded-2xl font-bold text-xs gap-1.5 cursor-pointer">
            <Plus className="h-4 w-4 text-primary" />
            Registrar Otro Servicio
          </Button>
        )}
        <Button type="button" onClick={onClose} className="w-full sm:w-auto flex-1 h-10 rounded-2xl bg-primary text-primary-foreground hover:bg-[#3451d6] font-bold text-xs shadow-sm shadow-primary/20 cursor-pointer">
          Listo, Volver a Servicios
        </Button>
      </div>
    </div>
  );
}

function ServiceStepFields({
  activeIndex,
  isDoctorOnly,
  defaultSpecialtyId,
  resolvedSpecialtyName,
  selectedEspId,
  setSelectedEspId,
  specialties,
  watchedCost,
  register,
  setValue,
  errors,
}: {
  activeIndex: number;
  isDoctorOnly?: boolean;
  defaultSpecialtyId?: string | number | null;
  resolvedSpecialtyName: string;
  selectedEspId: string;
  setSelectedEspId: (v: string) => void;
  specialties: Array<{ id_especialidad: number; nombre: string }>;
  watchedCost: number | string | undefined;
  register: UseFormRegister<ServiceInsert>;
  setValue: UseFormSetValue<ServiceInsert>;
  errors: FieldErrors<ServiceInsert>;
}) {
  if (activeIndex === 0) {
    return (
      <div className="space-y-4 py-1 max-w-2xl">
        <div className="space-y-2">
          <Label htmlFor="id_especialidad" className="text-xs font-bold text-foreground">
            Especialidad Médica Asignada
          </Label>
          {isDoctorOnly && defaultSpecialtyId ? (
            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-primary/30 bg-primary/[0.07] text-xs font-bold text-foreground">
              <Stethoscope className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">{resolvedSpecialtyName}</span>
              <span className="ml-auto text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">
                Tu Rama Médica
              </span>
            </div>
          ) : (
            <Select value={selectedEspId} onValueChange={setSelectedEspId}>
              <SelectTrigger className="w-full h-10 rounded-xl bg-background border-border/70 text-xs font-semibold">
                <SelectValue placeholder="Seleccione especialidad…" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-[280px]">
                <SelectItem value="none" className="font-semibold text-muted-foreground text-xs">
                  Servicio General / Multidisciplinario
                </SelectItem>
                {specialties.map((esp) => (
                  <SelectItem key={esp.id_especialidad} value={String(esp.id_especialidad)} className="text-xs font-medium">
                    {esp.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="nombre_servicio" className="text-xs font-bold text-foreground">
              Nombre del Servicio o Procedimiento *
            </Label>
            <Input
              id="nombre_servicio"
              placeholder="Ej. Consulta Ginecológica + Ecografía"
              {...register("nombre_servicio", { required: "El nombre es obligatorio" })}
              className="h-10 rounded-xl text-sm"
            />
            {errors.nombre_servicio && <span className="text-xs text-destructive">{errors.nombre_servicio.message}</span>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="codigo_medico" className="text-xs font-bold text-foreground flex items-center gap-1">
              <Hash className="h-3.5 w-3.5 text-primary" /> Código Médico
            </Label>
            <Input id="codigo_medico" placeholder="Ej. SER-001" {...register("codigo_medico")} className="h-10 rounded-xl text-sm font-mono uppercase" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-1 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="costo_base" className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Costo Base del Servicio ($ USD) *
        </Label>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Input
            id="costo_base"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...register("costo_base", { required: "El costo base es obligatorio", valueAsNumber: true })}
            className="h-10 rounded-xl text-base font-black sm:w-44"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-muted-foreground mr-1">Tarifas rápidas:</span>
            {QUICK_PRICES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setValue("costo_base", p, { shouldValidate: true })}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer",
                  Number(watchedCost) === p
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border hover:text-foreground",
                )}
              >
                ${p}
              </button>
            ))}
          </div>
        </div>
        {errors.costo_base && <span className="text-xs text-destructive">{errors.costo_base.message}</span>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="descripcion" className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-primary" /> Descripción Clínica del Servicio
        </Label>
        <Textarea
          id="descripcion"
          placeholder="Describe qué incluye este servicio o procedimiento (ej. Evaluación integral, ultrasonido pélvico y emisión de informe)…"
          {...register("descripcion")}
          className="rounded-xl text-sm resize-none min-h-[110px]"
        />
      </div>
    </div>
  );
}

export function ServiceForm(props: ServiceFormProps) {
  if (!props.open) return null;
  const formKey = `${props.service?.id_servicio ?? "new"}-${props.defaultSpecialtyId ?? "none"}`;
  return <ServiceFormWorkspace key={formKey} {...props} />;
}

function ServiceLiveHeader({
  isEdit,
  watchedCode,
  watchedName,
  watchedCost,
  resolvedSpecialtyName,
  onBack,
}: {
  isEdit: boolean;
  watchedCode: string;
  watchedName: string;
  watchedCost: number | string | undefined;
  resolvedSpecialtyName: string;
  onBack: () => void;
}) {
  return (
    <header className="mb-6 space-y-3.5 pb-5 border-b border-border/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <WorkspaceHeaderTitle
          backLabel="Volver a Servicios"
          title={isEdit ? "Editar Servicio Médico" : "Nuevo Servicio Médico"}
          badge="Catálogo Clínico"
          onBack={onBack}
        />
        {watchedCode.trim() && (
          <span className="text-xs font-mono font-extrabold text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 w-fit">
            Código: {watchedCode.trim().toUpperCase()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-2xl bg-muted/35 border border-border/60 items-center">
        <div className="md:col-span-5 flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">
              Servicio / Procedimiento
            </span>
            <p className="text-xs sm:text-sm font-extrabold text-foreground truncate mt-1">
              {watchedName.trim() || "Nuevo Servicio Médico"}
            </p>
          </div>
        </div>
        <div className="md:col-span-4 flex items-center gap-2.5 min-w-0 md:border-l md:border-border/60 md:pl-3.5">
          <div className="h-9 w-9 rounded-xl bg-background border border-border/70 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">
              Especialidad Asignada
            </span>
            <p className="text-xs font-extrabold text-foreground truncate mt-1">{resolvedSpecialtyName}</p>
          </div>
        </div>
        <div className="md:col-span-3 flex items-center gap-2.5 min-w-0 md:border-l md:border-border/60 md:pl-3.5">
          <div className="h-9 w-9 rounded-xl bg-background border border-border/70 text-emerald-500 flex items-center justify-center shrink-0">
            <DollarSign className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block leading-none">
              Costo Base
            </span>
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 truncate mt-1">
              ${Number(watchedCost || 0).toFixed(2)} USD
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

function resolveInitialSpecialtyId(
  service: Service | null,
  defaultSpecialtyId?: string | number | null,
): string {
  if (service?.id_especialidad) return String(service.id_especialidad);
  if (defaultSpecialtyId) return String(defaultSpecialtyId);
  return "none";
}

function resolveSpecialtyLabel(
  selectedEspId: string,
  specialties: Array<{ id_especialidad: number; nombre: string }>,
): string {
  if (selectedEspId === "none") return "Servicio General / Multidisciplinario";
  const match = specialties.find((e) => String(e.id_especialidad) === String(selectedEspId));
  return match?.nombre || "Especialidad Médica";
}

function ServiceFormWorkspace({
  onOpenChange,
  service,
  defaultSpecialtyId,
  isDoctorOnly,
}: ServiceFormProps) {
  const { register, handleSubmit, reset, watch, setValue, trigger, formState: { errors } } =
    useForm<ServiceInsert>({
      defaultValues: {
        nombre_servicio: service?.nombre_servicio ?? "",
        costo_base: service?.costo_base ?? 0,
        codigo_medico: service?.codigo_medico ?? "",
        descripcion: service?.descripcion ?? "",
      },
    });

  const [selectedEspId, setSelectedEspId] = useState<string>(() =>
    resolveInitialSpecialtyId(service, defaultSpecialtyId),
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [savedSummary, setSavedSummary] = useState<SavedServiceSummary | null>(null);

  const { data: specialties = [] } = useSpecialties();
  const createService = useCreateService();
  const updateService = useUpdateService();

  const watchedName = watch("nombre_servicio") || "";
  const watchedCost = watch("costo_base");
  const watchedCode = watch("codigo_medico") || "";
  const resolvedSpecialtyName = resolveSpecialtyLabel(selectedEspId, specialties);
  const isEdit = Boolean(service);
  const isPending = createService.isPending || updateService.isPending;
  const currentStep = SERVICE_STEPS[activeIndex] ?? SERVICE_STEPS[0];

  const handleNextStep = async () => {
    const valid = await trigger(["nombre_servicio"]);
    if (!valid) return;
    setActiveIndex((i) => Math.min(SERVICE_STEPS.length - 1, i + 1));
  };

  const onSubmit = (data: ServiceInsert) => {
    const payload = {
      ...data,
      costo_base: Number(data.costo_base) || 0,
      id_especialidad: selectedEspId === "none" ? null : parseInt(selectedEspId, 10),
    };
    const showSuccessState = () => {
      setSavedSummary({
        nombre_servicio: payload.nombre_servicio,
        costo_base: Number(payload.costo_base) || 0,
        codigo_medico: payload.codigo_medico,
        descripcion: payload.descripcion,
        specialtyName: resolvedSpecialtyName,
      });
    };

    if (service) {
      updateService.mutate({ id: service.id_servicio, data: payload }, { onSuccess: showSuccessState });
    } else {
      createService.mutate(payload, { onSuccess: showSuccessState });
    }
  };

  const handleResetForNew = () => {
    reset({ nombre_servicio: "", costo_base: 0, codigo_medico: "", descripcion: "" });
    setActiveIndex(0);
    setSavedSummary(null);
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-xs min-h-[calc(100vh-8rem)] flex flex-col text-foreground w-full min-w-0 animate-in fade-in duration-200">
      <ServiceLiveHeader
        isEdit={isEdit}
        watchedCode={watchedCode}
        watchedName={watchedName}
        watchedCost={watchedCost}
        resolvedSpecialtyName={resolvedSpecialtyName}
        onBack={() => onOpenChange(false)}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col lg:flex-row min-w-0">
        <WorkspaceStepper
          steps={SERVICE_STEPS}
          activeIndex={activeIndex}
          isAllCompleted={Boolean(savedSummary)}
          sealedBadge="Servicio Guardado"
          sealedTitle="Catálogo Actualizado"
          onSelectStep={setActiveIndex}
        />

        <div className="flex-1 min-w-0 lg:pl-8 flex flex-col justify-between">
          {savedSummary ? (
            <ServiceSuccessView
              savedSummary={savedSummary}
              isEdit={isEdit}
              onResetForNew={handleResetForNew}
              onClose={() => onOpenChange(false)}
            />
          ) : (
            <>
              <div className="min-w-0">
                <WorkspaceStepHeader
                  stepNumber={activeIndex + 1}
                  totalSteps={SERVICE_STEPS.length}
                  title={currentStep.title}
                  subtitle={currentStep.subtitle}
                />

                <ServiceStepFields
                  activeIndex={activeIndex}
                  isDoctorOnly={isDoctorOnly}
                  defaultSpecialtyId={defaultSpecialtyId}
                  resolvedSpecialtyName={resolvedSpecialtyName}
                  selectedEspId={selectedEspId}
                  setSelectedEspId={setSelectedEspId}
                  specialties={specialties}
                  watchedCost={watchedCost}
                  register={register}
                  setValue={setValue}
                  errors={errors}
                />
              </div>

              <WorkspaceStepperFooter
                isFirstStep={activeIndex === 0}
                isLastStep={activeIndex === SERVICE_STEPS.length - 1}
                isPending={isPending}
                canQuickSubmit={isEdit || Boolean(watchedName.trim())}
                submitLabel={isEdit ? "Guardar Cambios" : "Añadir Servicio"}
                onCancel={() => onOpenChange(false)}
                onPrev={() => setActiveIndex((i) => Math.max(0, i - 1))}
                onNext={handleNextStep}
              />
            </>
          )}
        </div>
      </form>
    </div>
  );
}
