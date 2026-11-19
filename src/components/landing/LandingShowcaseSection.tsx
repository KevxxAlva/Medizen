import { useState } from "react";
import {
  Calendar,
  Clock,
  Stethoscope,
  ReceiptText,
  FileCheck2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ShowcaseTab = "agenda" | "expediente" | "sala" | "facturacion";

interface TabItem {
  id: ShowcaseTab;
  label: string;
  icon: LucideIcon;
}

const TABS: TabItem[] = [
  { id: "agenda", label: "Agenda & Citas", icon: Calendar },
  { id: "expediente", label: "Expediente & Récipes", icon: Stethoscope },
  { id: "sala", label: "Sala de Espera en Vivo", icon: Clock },
  { id: "facturacion", label: "Facturación & Divisas", icon: ReceiptText },
];

export function LandingShowcaseSection() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>("agenda");

  return (
    <section
      id="showcase"
      className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8"
    >
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border/60 text-xs font-semibold text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Experiencia de Usuario Diseñada para Doctores</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
          Una suite clínica sin fricción ni curvas complejas
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
          Haz clic en los módulos para explorar cómo opera cada área del sistema.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer",
                active
                  ? "bg-primary text-primary-foreground shadow-xs shadow-primary/30"
                  : "bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-4 sm:p-6 lg:p-8 rounded-3xl border border-border/80 bg-card/90 dark:bg-zinc-950/90 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 text-xs font-mono text-muted-foreground hidden sm:inline">
              medizen://app/{activeTab}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Sistema en Línea
            </span>
          </div>
        </div>

        {activeTab === "agenda" && <ShowcaseAgendaTab />}
        {activeTab === "expediente" && <ShowcaseExpedienteTab />}
        {activeTab === "sala" && <ShowcaseSalaTab />}
        {activeTab === "facturacion" && <ShowcaseFacturacionTab />}
      </div>
    </section>
  );
}

function ShowcaseAgendaTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
      <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">08:30 AM</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            Atendido
          </span>
        </div>
        <h3 className="text-sm font-semibold text-foreground">Dra. Coromoto Sánchez</h3>
        <p className="text-xs text-muted-foreground">Control prenatal mensual • Semana 28</p>
        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Historia #MD-2026-081</span>
          <span className="font-medium text-foreground">Dr. Rodríguez</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-primary">09:15 AM (En Curso)</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
            En Consulta
          </span>
        </div>
        <h3 className="text-sm font-semibold text-foreground">María Valentina Pérez</h3>
        <p className="text-xs text-muted-foreground">Eco Doppler obstétrico y nota evolutiva</p>
        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Historia #MD-2026-104</span>
          <span className="font-medium text-primary">Dr. Rodríguez</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">10:00 AM</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
            En Sala
          </span>
        </div>
        <h3 className="text-sm font-semibold text-foreground">Lucía Mendoza</h3>
        <p className="text-xs text-muted-foreground">Revisión de citología y laboratorio</p>
        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Historia #MD-2026-112</span>
          <span className="font-medium text-foreground">Dr. Rodríguez</span>
        </div>
      </div>
    </div>
  );
}

function ShowcaseExpedienteTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
      <div className="p-5 rounded-2xl bg-muted/30 border border-border/60 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Nota Evolutiva y Exploración</h3>
          <span className="text-[11px] text-muted-foreground">Dictado por voz habilitado</span>
        </div>
        <div className="p-3.5 rounded-xl bg-card border border-border/60 text-xs text-muted-foreground leading-relaxed">
          &ldquo;Paciente femenina de 31 años acude a consulta de control. Signos vitales estables,
          PA 115/75 mmHg, FC 74 lpm. Fondo uterino acorde a EG. FCF 142 lpm rítmico. Se indican
          exámenes de rutina y suplemento de hierro.&rdquo;
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-primary/10 text-primary">
            Eco Obstétrico Adjunto
          </span>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500">
            Firma Electrónica Médica
          </span>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Récipe Médico Digital Oficial</h3>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/15 text-primary">
            MED-2026-A8F2
          </span>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between border-b border-border/40 pb-1">
            <span className="font-medium text-foreground">Sulfato Ferroso 200mg</span>
            <span>1 tableta cada 24 hrs x 30 días</span>
          </div>
          <div className="flex justify-between border-b border-border/40 pb-1">
            <span className="font-medium text-foreground">Ácido Fólico 5mg</span>
            <span>1 cápsula diaria con el desayuno</span>
          </div>
        </div>
        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <FileCheck2 className="w-4 h-4" />
            <span>Verificable por farmacias</span>
          </div>
          <span className="text-xs text-primary font-semibold">Envío WhatsApp directo</span>
        </div>
      </div>
    </div>
  );
}

function ShowcaseSalaTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
      <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
          1. Registrados en Recepción
        </p>
        <p className="text-2xl font-extrabold text-foreground">4 Pacientes</p>
        <p className="text-xs text-muted-foreground">Llegada verificada con cédula y turno</p>
      </div>

      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
        <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
          2. En Sala de Espera
        </p>
        <p className="text-2xl font-extrabold text-foreground">2 Pacientes</p>
        <p className="text-xs text-muted-foreground">Tiempo promedio de espera: 8 minutos</p>
      </div>

      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
          3. En Consultorio
        </p>
        <p className="text-2xl font-extrabold text-foreground">1 En Atención</p>
        <p className="text-xs text-muted-foreground">Dr. Rodríguez • Consultorio 2</p>
      </div>
    </div>
  );
}

function ShowcaseFacturacionTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
      <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">Tasa Oficial BCV</span>
          <span className="text-[10px] font-bold text-emerald-500">En Vivo</span>
        </div>
        <p className="text-2xl font-extrabold text-foreground">Bs. / USD</p>
        <p className="text-xs text-muted-foreground">Sincronización automática sin discrepancias</p>
      </div>

      <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">Cierre Diario Z</span>
          <span className="text-[10px] font-bold text-primary">Tesorería</span>
        </div>
        <p className="text-2xl font-extrabold text-foreground">Multi-método</p>
        <p className="text-xs text-muted-foreground">Pago Móvil, Zelle, Efectivo, Punto y USDT</p>
      </div>

      <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">Honorarios</span>
          <span className="text-[10px] font-bold text-amber-500">Liquidación</span>
        </div>
        <p className="text-2xl font-extrabold text-foreground">Porcentaje / Monto</p>
        <p className="text-xs text-muted-foreground">Partición transparente médico y clínica</p>
      </div>
    </div>
  );
}

