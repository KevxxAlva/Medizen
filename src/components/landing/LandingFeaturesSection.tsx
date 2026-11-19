import {
  Calendar,
  Clock,
  CreditCard,
  Lock,
  Building2,
  FileCheck2,
  HeartHandshake,
} from "lucide-react";

export function LandingFeaturesSection() {
  return (
    <section
      id="caracteristicas"
      className="py-16 border-t border-border/40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-10"
    >
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>Diseñado para Médicos, Especialistas y Centros Clínicos</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
          Todo lo que tu práctica médica necesita en un solo lugar
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-border/70 bg-card hover:border-primary/40 transition-colors space-y-3.5">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-base text-foreground">
            Agenda Médica Inteligente
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Citas con aislamiento por especialista, vista semanal o diaria, estados en vivo y
            recordatorios automáticos para reducir inasistencias.
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-border/70 bg-card hover:border-primary/40 transition-colors space-y-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-base text-foreground">
            Récipes con Validación Oficial
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Diseñador de recetas médicas con firma, membrete corporativo, código verificable y
            envío con 1 toque vía WhatsApp al paciente.
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-border/70 bg-card hover:border-primary/40 transition-colors space-y-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-base text-foreground">
            Sala de Espera Sincronizada
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Monitoreo de flujo de pacientes en recepción y consultorios. Sincronización instantánea
            por WebSockets sin necesidad de llamadas internas.
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-border/70 bg-card hover:border-primary/40 transition-colors space-y-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-base text-foreground">
            Tesorería y Tasa BCV Oficial
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Cobranza transparente en Bolívares, Dólares, Euros o USDT con conversión automática en
            tiempo real y cierre de caja diario (Reporte Z).
          </p>
        </div>

        {/* Security anchor target */}
        <div
          id="seguridad"
          className="scroll-mt-24 p-6 rounded-3xl border border-border/70 bg-card hover:border-primary/40 transition-colors space-y-3.5"
        >
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-base text-foreground">
            Bóveda Criptográfica por PIN
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Desbloqueo clínico en 1 segundo con PIN personal de 4 dígitos, cifrado AES-256 local y
            bloqueo automático por inactividad.
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-border/70 bg-card hover:border-primary/40 transition-colors space-y-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-base text-foreground">
            Multi-Consultorio & Roles
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Permisos estrictos para médicos, enfermería, recepción y administración con políticas
            Row Level Security (RLS) en base de datos.
          </p>
        </div>
      </div>
    </section>
  );
}

