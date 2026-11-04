import { APP_TIME_ZONE } from "@/lib/constants/locale";
import { useState, useMemo } from "react";
import { usePatientConsultations, type Consultation } from "@/lib/api/consultations";
import { usePatient } from "@/lib/api/patients";
import { useDoctors } from "@/lib/api/profiles";
import { useClinicInfo } from "@/lib/api/clinic";
import { sendRecipeViaWhatsApp } from "@/lib/utils/whatsapp";
import { Button } from "@/components/ui/button";
import { Loader2, Stethoscope, ChevronDown, ChevronUp, FileText, Pill, Thermometer, Droplet, Activity, Scaling, TestTube, Crosshair, Package, Printer, MessageSquare, AlertTriangle, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SpecialtyDataViewer } from "@/components/consultation/SpecialtyDataViewer";
import { getSpecialtyBadgeStyle } from "@/lib/constants/specialtyForms";
import { cn } from "@/lib/utils";

export function PatientConsultationsPanel({ patientId }: { patientId: string }) {
  const { data: consultations = [], isLoading } = usePatientConsultations(patientId);
  const { data: patient } = usePatient(patientId);
  const { data: doctors = [] } = useDoctors();
  const { data: clinic } = useClinicInfo();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleExportRecipe = async (c: Consultation) => {
    if (!patient) return;
    const doctorObj = doctors.find((d) => d.id === c.doctor_id);
    const doctorName = doctorObj?.full_name || doctorObj?.email || "Médico Tratante";

    const { generateRecipePDF } = await import("@/lib/utils/recipePdf");
    await generateRecipePDF(
      {
        full_name: patient.full_name,
        document_id: patient.document_id,
        birth_date: patient.birth_date,
      },
      {
        created_at: c.created_at,
        indications: c.indications,
      },
      doctorName,
      doctorObj?.specialty,
      doctorObj?.university,
      doctorObj?.mpps,
      doctorObj?.cmc
    );
  };

  const [isUploading, setIsUploading] = useState<string | null>(null);

  const handleSendWhatsApp = async (c: Consultation) => {
    if (!patient) return;
    
    setIsUploading(c.id);
    const toastId = toast.loading("Generando y subiendo récipe a la nube...");
    
    try {
      const doctorObj = doctors.find((d) => d.id === c.doctor_id);
      const doctorName = doctorObj?.full_name || doctorObj?.email || "Médico Tratante";

      // 1. Generar el PDF como Blob (carga diferida de jsPDF)
      const { generateRecipePDF } = await import("@/lib/utils/recipePdf");
      const pdfBlob = await generateRecipePDF(
        {
          full_name: patient.full_name,
          document_id: patient.document_id,
          birth_date: patient.birth_date,
        },
        {
          created_at: c.created_at,
          indications: c.indications,
        },
        doctorName,
        doctorObj?.specialty,
        doctorObj?.university,
        doctorObj?.mpps,
        doctorObj?.cmc,
        true // returnBlob = true
      ) as Blob;

      if (!pdfBlob) throw new Error("No se pudo generar el PDF.");

      // 2. Subir a Supabase Storage
      const cleanName = patient.full_name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `Recipe_${cleanName}_${c.id}.pdf`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("recipes")
        .upload(filename, pdfBlob, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 3. Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from("recipes")
        .getPublicUrl(filename);

      // 4. Enviar WhatsApp
      sendRecipeViaWhatsApp({
        patientName: patient.full_name,
        patientPhone: patient.phone,
        consultationDate: c.created_at,
        indications: c.indications || c.plan || "",
        doctorName,
        clinicName: clinic?.name || "FemeSalud",
        recipeUrl: publicUrlData.publicUrl
      });
      
      toast.success("Enlace de récipe generado correctamente", { id: toastId });
    } catch (error) {
      console.error("Error subiendo el PDF:", error);
      const msg = error instanceof Error ? error.message : (error as any)?.message || JSON.stringify(error);
      toast.error(`Error al subir PDF: ${msg}`, { id: toastId });
    } finally {
      setIsUploading(null);
    }
  };

  if (isLoading) {
    return <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (consultations.length === 0) {
    return (
      <div className="py-12 text-center text-sm font-medium text-muted-foreground border-2 border-dashed border-border/50 rounded-2xl bg-muted/20">
        No hay consultas registradas para este paciente.
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      <PatientVitalsChart consultations={consultations} />
      {consultations.map((c) => {
        const isExpanded = expandedId === c.id;
        const toggle = () => setExpandedId(isExpanded ? null : c.id);

        return (
          <div key={c.id} className="border border-border/60 bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-200">
            <button
              type="button"
              onClick={toggle}
              aria-expanded={isExpanded}
              className="w-full text-left p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition select-none"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground capitalize">
                      {c.visit_type === "PRIMERA_VEZ" ? "Consulta Primera Vez" : 
                       c.visit_type === "CONTROL" ? "Consulta de Control" : 
                       c.visit_type === "EMERGENCIA" ? "Consulta de Emergencia" : c.visit_type || "Consulta Clínica"}
                    </h4>
                    {c.specialty_name && (
                      <span className={cn("text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border", getSpecialtyBadgeStyle(c.specialty_name).className)}>
                        {c.specialty_name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                    {new Date(c.created_at).toLocaleDateString("es-ES", { timeZone: APP_TIME_ZONE, weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    <span>•</span>
                    {new Date(c.created_at).toLocaleTimeString("es-ES", { timeZone: APP_TIME_ZONE, hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <div className="text-muted-foreground">
                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </button>

            {isExpanded && (
              <div className="p-4 pt-0 border-t border-border/40 text-sm bg-muted/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* Columna Izquierda */}
                  <div className="space-y-6">
                    {/* Motivo de Consulta */}
                    <div>
                      <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Motivo de Consulta / Síntomas
                      </h5>
                      <p className="text-foreground whitespace-pre-wrap">{c.subjective_exam || "No especificado."}</p>
                    </div>
                    
                    {/* Examen Físico y Signos Vitales */}
                    <div className="bg-card p-4 rounded-xl border border-border/40 shadow-sm">
                      <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Signos Vitales</h5>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {c.weight_kg && <div className="flex gap-2 items-center"><Scaling className="h-4 w-4 text-muted-foreground"/> <span className="font-semibold">{c.weight_kg} kg</span></div>}
                        {c.height_cm && <div className="flex gap-2 items-center"><Activity className="h-4 w-4 text-muted-foreground"/> <span className="font-semibold">{c.height_cm} cm</span></div>}
                        {c.blood_pressure && <div className="flex gap-2 items-center"><Crosshair className="h-4 w-4 text-muted-foreground"/> <span className="font-semibold">{c.blood_pressure} mmHg</span></div>}
                        {c.temperature && <div className="flex gap-2 items-center"><Thermometer className="h-4 w-4 text-muted-foreground"/> <span className="font-semibold">{c.temperature} °C</span></div>}
                        {c.heart_rate && <div className="flex gap-2 items-center"><Activity className="h-4 w-4 text-muted-foreground"/> <span className="font-semibold">{c.heart_rate} bpm</span></div>}
                      </div>
                      
                      {c.gynecological && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <h6 className="font-semibold text-xs text-muted-foreground mb-1">
                            {c.specialty_name && !c.specialty_name.toLowerCase().includes("ginec") ? "Examen Físico Especializado" : "Examen Físico / Ginecológico"}
                          </h6>
                          <p className="text-foreground whitespace-pre-wrap">{c.gynecological}</p>
                        </div>
                      )}
                    </div>

                    {/* Specialty Dynamic Data */}
                    {c.specialty_data && Object.keys(c.specialty_data).length > 0 && (
                      <SpecialtyDataViewer specialtyName={c.specialty_name} data={c.specialty_data} />
                    )}
                  </div>

                  {/* Columna Derecha */}
                  <div className="space-y-6">
                    {/* Diagnóstico y Plan */}
                    <div className="bg-primary/5 p-4 rounded-xl border border-[#4361ee]/10 shadow-sm">
                      <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" /> Diagnóstico
                      </h5>
                      <p className="text-foreground font-medium whitespace-pre-wrap mb-4">{c.diagnosis || "No especificado."}</p>
                      
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-bold text-primary uppercase tracking-wider">
                           Plan y Tratamiento / Récipe
                        </h5>
                        {(c.indications || c.plan) && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExportRecipe(c)}
                              className="h-7 px-2.5 text-xs rounded-xl flex items-center gap-1.5 cursor-pointer bg-background hover:bg-muted"
                            >
                              <Printer className="h-3.5 w-3.5 text-primary" /> PDF
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendWhatsApp(c)}
                              disabled={isUploading === c.id}
                              className="h-7 px-2.5 text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold"
                            >
                              {isUploading === c.id ? (
                                <Loader2 className="h-3.5 w-3.5 text-emerald-500 animate-spin" />
                              ) : (
                                <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                              )}
                              WhatsApp
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-foreground whitespace-pre-wrap">{c.plan || c.indications || "No especificado."}</p>
                    </div>

                    {/* Exámenes y Consumibles */}
                    <div className="space-y-4">
                      {c.complementary_exams && (
                        <div>
                          <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <TestTube className="h-3.5 w-3.5" /> Exámenes Complementarios
                          </h5>
                          <p className="text-foreground">{c.complementary_exams}</p>
                        </div>
                      )}

                      {c.consumables && c.consumables.length > 0 && (
                        <div>
                          <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5" /> Insumos Utilizados
                          </h5>
                          <ul className="space-y-1">
                            {c.consumables.map((item, idx) => (
                              <li key={item.id || `${item.item_name}-${item.quantity}`} className="flex justify-between items-center text-xs bg-card px-3 py-1.5 rounded-lg border border-border/40 shadow-sm">
                                <span className="font-medium text-foreground">{item.item_name}</span>
                                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-semibold">{item.quantity} und</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


function PatientVitalsChart({ consultations }: { consultations: Consultation[] }) {
  const [metric, setMetric] = useState<"bp" | "weight">("bp");

  const chartData = useMemo(() => {
    const ordered = [...consultations].reverse();
    return ordered
      .map((c) => {
        const bpStr = c.blood_pressure || "";
        const bpParts = bpStr.split("/");
        const sys = bpParts[0] ? parseInt(bpParts[0], 10) : null;
        const dia = bpParts[1] ? parseInt(bpParts[1], 10) : null;
        const w = c.weight_kg ? Number(c.weight_kg) : null;
        const h = c.height_cm ? Number(c.height_cm) / 100 : null;
        const bmi = w && h && h > 0 ? Number((w / (h * h)).toFixed(1)) : null;

        return {
          date: new Date(c.created_at).toLocaleDateString("es-VE", {
            day: "2-digit",
            month: "short",
          }),
          sistolica: !isNaN(sys as number) ? sys : null,
          diastolica: !isNaN(dia as number) ? dia : null,
          peso: w,
          imc: bmi,
        };
      })
      .filter((d) => d.sistolica !== null || d.peso !== null);
  }, [consultations]);

  const hasHighBp = useMemo(
    () => chartData.some((d) => (d.sistolica && d.sistolica >= 140) || (d.diastolica && d.diastolica >= 90)),
    [chartData]
  );

  if (chartData.length === 0) return null;

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
              Curva Evolutiva de Signos Vitales y Peso / IMC
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Seguimiento longitudinal en {chartData.length} consulta(s)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasHighBp && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
              <AlertTriangle className="h-3 w-3" /> Alerta PA ≥ 140/90 mmHg
            </span>
          )}
          <div className="inline-flex rounded-xl bg-muted/60 p-0.5 border border-border/60">
            <button
              type="button"
              onClick={() => setMetric("bp")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer",
                metric === "bp"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tensión Arterial (mmHg)
            </button>
            <button
              type="button"
              onClick={() => setMetric("weight")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer",
                metric === "weight"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Peso (kg) / IMC
            </button>
          </div>
        </div>
      </div>

      <div className="h-48 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {metric === "bp" ? (
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[50, 180]} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              />
              <Line
                type="monotone"
                dataKey="sistolica"
                name="PA Sistólica (mmHg)"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="diastolica"
                name="PA Diastólica (mmHg)"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              />
              <Line
                type="monotone"
                dataKey="peso"
                name="Peso (kg)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="imc"
                name="IMC (kg/m²)"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 3.5 }}
                connectNulls
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
