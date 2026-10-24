import { Link } from "@tanstack/react-router";
import { Filter, Download, Search, LifeBuoy, Grid } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AgendaToolbarProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onDownloadAgenda: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  isSearchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
  compactMode: boolean;
  onCompactModeChange: (compact: boolean) => void;
}

export function AgendaToolbar({
  statusFilter,
  onStatusFilterChange,
  onDownloadAgenda,
  searchQuery,
  onSearchQueryChange,
  isSearchOpen,
  onSearchOpenChange,
  compactMode,
  onCompactModeChange,
}: AgendaToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 text-xs font-bold text-foreground border border-border/40 rounded-xl px-4 py-2 hover:bg-muted focus:outline-none">
              <Filter className="h-4 w-4 text-muted-foreground" /> Filtro
              {statusFilter !== "todas" && (
                <span className="bg-primary w-2 h-2 rounded-full absolute top-1 right-1"></span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-xl">
            <DropdownMenuItem
              onClick={() => onStatusFilterChange("todas")}
              className="text-xs font-bold cursor-pointer"
            >
              Completadas y en Espera (Todas)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onStatusFilterChange("pendiente")}
              className="text-xs font-bold cursor-pointer"
            >
              Solo en Espera (Pendientes)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onStatusFilterChange("completada")}
              className="text-xs font-bold cursor-pointer"
            >
              Solo Completadas
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onStatusFilterChange("cancelada")}
              className="text-xs font-bold cursor-pointer text-destructive hover:text-destructive focus:text-destructive"
            >
              Ver Canceladas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          onClick={onDownloadAgenda}
          className="flex items-center gap-2 text-xs font-bold text-foreground border border-border/40 rounded-xl px-4 py-2 hover:bg-muted cursor-pointer"
        >
          <Download className="h-4 w-4 text-muted-foreground" /> Descargar Datos
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center transition-[width] duration-300 overflow-hidden",
            isSearchOpen ? "w-48 opacity-100" : "w-9 opacity-100",
          )}
        >
          {isSearchOpen ? (
            <div className="relative w-full">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                onBlur={() => {
                  if (!searchQuery) onSearchOpenChange(false);
                }}
                placeholder="Buscar paciente..."
                aria-label="Buscar paciente"
                className="w-full h-9 pl-9 pr-3 text-xs border border-[#4361ee] rounded-full focus:outline-none focus:ring-1 focus:ring-[#4361ee]"
              />
              <Search className="h-4 w-4 text-primary absolute left-3 top-2.5" />
            </div>
          ) : (
            <button
              type="button"
              aria-label="Abrir buscador de citas"
              onClick={() => onSearchOpenChange(true)}
              className="h-9 w-9 shrink-0 flex items-center justify-center border border-border/40 rounded-full text-muted-foreground hover:bg-muted focus:outline-none"
            >
              <Search className="h-4 w-4" />
            </button>
          )}
        </div>
        <Link to="/support">
          <button className="flex items-center gap-2 text-xs font-bold text-foreground border border-border/40 rounded-xl px-4 py-2 hover:bg-muted">
            <LifeBuoy className="h-4 w-4 text-muted-foreground" /> Soporte
          </button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 text-xs font-bold text-foreground border border-border/40 rounded-xl px-4 py-2 hover:bg-muted focus:outline-none focus:ring-0">
              <Grid className="h-4 w-4 text-muted-foreground" /> Diseño
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem
              onClick={() => onCompactModeChange(false)}
              className="text-xs font-bold cursor-pointer"
            >
              Vista Cómoda (Normal)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onCompactModeChange(true)}
              className="text-xs font-bold cursor-pointer"
            >
              Vista Compacta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
