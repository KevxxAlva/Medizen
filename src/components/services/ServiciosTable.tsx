import { Loader2, Pencil, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Service } from "@/lib/api/services";
import { getSpecialtyBadgeStyle } from "@/lib/constants/specialtyForms";

interface ServiciosTableProps {
  isLoading: boolean;
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

export function ServiciosTable({
  isLoading,
  services,
  onEdit,
  onDelete,
}: ServiciosTableProps) {
  return (
    <div className="flex-1 w-full min-w-0 overflow-x-auto border border-border rounded-2xl bg-card shadow-xs">
      <table className="w-full text-left border-collapse min-w-[650px]">
        <thead>
          <tr className="bg-muted/70 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
            <th className="p-4 rounded-tl-xl">Nombre del Servicio</th>
            <th className="p-4">Especialidad</th>
            <th className="p-4">Código Médico</th>
            <th className="p-4">Descripción</th>
            <th className="p-4">Costo Base</th>
            <th className="p-4 rounded-tr-xl text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {isLoading ? (
            <tr>
              <td colSpan={6} className="p-12 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
              </td>
            </tr>
          ) : services.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-12 text-center text-muted-foreground font-medium">
                No se encontraron servicios médicos para el filtro seleccionado.
              </td>
            </tr>
          ) : (
            services.map((s) => {
              const espName = s.especialidades?.nombre || "Multidisciplinario";
              const badge = getSpecialtyBadgeStyle(espName);

              return (
                <tr
                  key={s.id_servicio}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group"
                >
                  <td className="p-4 font-bold text-foreground">{s.nombre_servicio}</td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "text-[10px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider inline-flex items-center gap-1",
                        badge.className,
                      )}
                    >
                      <Sparkles className="w-2.5 h-2.5 opacity-70" />
                      {espName}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground font-medium">
                    {s.codigo_medico ? (
                      <span className="bg-muted px-2 py-1 rounded-md text-xs font-mono font-semibold">
                        {s.codigo_medico}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    className="p-4 text-muted-foreground text-xs max-w-[240px] truncate"
                    title={s.descripcion || ""}
                  >
                    {s.descripcion || "Sin descripción"}
                  </td>
                  <td className="p-4">
                    <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-extrabold px-2.5 py-1 text-xs rounded-full border border-emerald-200 dark:border-emerald-800">
                      ${Number(s.costo_base || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-3 text-muted-foreground">
                      <button
                        type="button"
                        aria-label={`Editar servicio ${s.nombre_servicio}`}
                        onClick={() => onEdit(s)}
                        className="hover:text-primary transition-colors p-1"
                        title="Editar servicio"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Eliminar servicio ${s.nombre_servicio}`}
                        onClick={() => onDelete(s)}
                        className="hover:text-destructive transition-colors p-1"
                        title="Eliminar servicio"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
