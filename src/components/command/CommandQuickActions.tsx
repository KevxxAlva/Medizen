import { Command } from "cmdk";
import { CalendarPlus, UserPlus, ShieldCheck } from "lucide-react";

interface CommandQuickActionsProps {
  onNewAppointment: () => void;
  onNewPatient: () => void;
  onOpenVerification: () => void;
}

export function CommandQuickActions({
  onNewAppointment,
  onNewPatient,
  onOpenVerification,
}: CommandQuickActionsProps) {
  return (
    <Command.Group heading="Acciones Rápidas" className="text-xs font-bold text-muted-foreground px-2 py-2">
      <Command.Item
        onSelect={onNewAppointment}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-foreground transition-colors mt-1"
      >
        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
          <CalendarPlus className="w-4 h-4" />
        </div>
        <span className="text-sm font-semibold flex-1">Nueva Cita</span>
      </Command.Item>
      <Command.Item
        onSelect={onNewPatient}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-foreground transition-colors mt-1"
      >
        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
          <UserPlus className="w-4 h-4" />
        </div>
        <span className="text-sm font-semibold flex-1">Nuevo Paciente</span>
      </Command.Item>
      <Command.Item
        onSelect={onOpenVerification}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-foreground transition-colors mt-1"
      >
        <div className="h-8 w-8 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <span className="text-sm font-semibold flex-1">Validar Récipe / Código QR Oficial</span>
      </Command.Item>
    </Command.Group>
  );
}
