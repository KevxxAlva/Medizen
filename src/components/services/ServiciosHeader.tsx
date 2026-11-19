import { Search, Plus, X, ChevronLeft, Stethoscope } from "lucide-react";

interface ServiciosHeaderProps {
  q: string;
  onSearchChange: (val: string) => void;
  onClearSearch: () => void;
  onAddService: () => void;
}

export function ServiciosHeader({
  q,
  onSearchChange,
  onClearSearch,
  onAddService,
}: ServiciosHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Volver"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" /> Servicios Médicos
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Catálogo de servicios, procedimientos clínicos y tarifas organizados por especialidad.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full sm:w-auto">
        <div className="flex items-center gap-2 rounded-full bg-muted border border-border px-4 py-2.5 w-full">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por servicio, código o especialidad…"
            aria-label="Buscar por servicio, código o especialidad"
            className="w-full bg-transparent text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40 rounded-lg px-1 placeholder:text-muted-foreground text-foreground"
          />
          {q && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={onClearSearch}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onAddService}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Añadir Servicio
        </button>
      </div>
    </header>
  );
}
