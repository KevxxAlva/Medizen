import { Plus } from "lucide-react";

interface AgendaHeaderProps {
  onNewAppointment: () => void;
}

export function AgendaHeader({ onNewAppointment }: AgendaHeaderProps) {
  return (
    <header className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-primary tracking-tight">Agenda</h1>
      <button
        type="button"
        onClick={onNewAppointment}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-bold shadow-md hover:bg-[#3451d6] transition-colors"
      >
        <Plus className="h-4 w-4" strokeWidth={3} /> Nueva Cita
      </button>
    </header>
  );
}
