import {
  FileBarChart2,
  ReceiptText,
  CalendarCheck2,
  Users,
  FileSpreadsheet,
  Download,
  Sparkles,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReportsExportHubProps {
  from: string;
  to: string;
  onExportExecutive: () => void;
  onExportSales: () => void;
  onExportAppointments: () => void;
  onExportPatients: () => void;
  onOpenCashClose: () => void;
  onExportCsv: () => void;
}

export function ReportsExportHub({
  from,
  to,
  onExportExecutive,
  onExportSales,
  onExportAppointments,
  onExportPatients,
  onOpenCashClose,
  onExportCsv,
}: ReportsExportHubProps) {
  const reportCards = [
    {
      id: "executive",
      title: "Reporte Ejecutivo Integral",
      badge: "Gerencial · PDF",
      description:
        "Informe institucional con KPIs clínicos, ingresos en USD/Bs., canales de captación y comparativa de 12 meses.",
      icon: FileBarChart2,
      accent: "text-primary bg-primary/10 border-primary/20",
      buttonLabel: "Descargar Ejecutivo PDF",
      onClick: onExportExecutive,
      featured: true,
    },
    {
      id: "sales",
      title: "Ventas y Cobranzas BCV",
      badge: "Finanzas · PDF",
      description:
        "Auditoría de facturas emitidas, cobradas y pendientes en Dólares ($), Euros (€) y Bolívares a tasa BCV.",
      icon: ReceiptText,
      accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      buttonLabel: "Descargar Ventas PDF",
      onClick: onExportSales,
    },
    {
      id: "appointments",
      title: "Libro de Citas y Consultas",
      badge: "Operativo · PDF",
      description:
        "Relación de consultas médicas completadas, programadas y canceladas con médico tratante y motivo.",
      icon: CalendarCheck2,
      accent: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
      buttonLabel: "Descargar Citas PDF",
      onClick: onExportAppointments,
    },
    {
      id: "patients",
      title: "Padrón de Pacientes",
      badge: "Directorio · PDF",
      description:
        "Censo de pacientes registrados en el período con documento de identidad, teléfono y fecha de ingreso.",
      icon: Users,
      accent: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20",
      buttonLabel: "Descargar Pacientes PDF",
      onClick: onExportPatients,
    },
    {
      id: "cashclose",
      title: "Cierre Z de Caja Diario",
      badge: "Tesorería · HOY",
      description:
        "Cuadre diario por método de cobro: Efectivo en divisa, Pago Móvil / Bancos, Cashea y Binance USDT.",
      icon: Wallet,
      accent: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
      buttonLabel: "Abrir Cierre Z Diario",
      onClick: onOpenCashClose,
    },
  ];

  return (
    <section className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-3 w-3" /> Centro de Descargas
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Período activo: <strong className="text-foreground">{from}</strong> al{" "}
              <strong className="text-foreground">{to}</strong>
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-foreground mt-1">
            ¿Qué reporte deseas generar hoy?
          </h2>
        </div>

        <button
          type="button"
          onClick={onExportCsv}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-border bg-muted/50 hover:bg-muted text-foreground transition-colors cursor-pointer shrink-0"
          title="Exportar datos del período a hoja de cálculo Excel / CSV"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Exportar Datos (Excel / CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5">
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className={cn(
                "group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 hover:shadow-md",
                card.featured
                  ? "bg-gradient-to-b from-primary/[0.06] to-transparent border-primary/30"
                  : "bg-background/60 border-border hover:border-primary/30"
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl border",
                      card.accent
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {card.badge}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 mb-4">
                  {card.description}
                </p>
              </div>

              <button
                type="button"
                onClick={card.onClick}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  card.featured
                    ? "bg-primary text-primary-foreground hover:opacity-95 shadow-xs"
                    : "bg-muted/80 hover:bg-primary hover:text-primary-foreground text-foreground"
                )}
              >
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span>{card.buttonLabel}</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
