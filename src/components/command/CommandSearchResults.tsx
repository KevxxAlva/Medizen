import { Command } from "cmdk";
import { User, Calendar, FileText } from "lucide-react";

export interface SearchPatient {
  id: string;
  full_name: string;
  document_id: string;
}

export interface SearchAppointment {
  id: string;
  scheduled_at: string;
  reason: string;
  patient_name: string;
}

export interface SearchInvoice {
  id_factura: number;
  total_general: number;
  fecha_emision: string;
  pacientes?: {
    nombre: string;
    apellido: string;
  } | null;
}

interface CommandSearchResultsProps {
  q: string;
  search: string;
  hasResults: boolean;
  filteredPatients: SearchPatient[];
  filteredAppointments: SearchAppointment[];
  filteredInvoices: SearchInvoice[];
  onSelectPatient: (id: string) => void;
  onSelectAppointment: () => void;
  onSelectInvoice: () => void;
}

export function CommandSearchResults({
  q,
  search,
  hasResults,
  filteredPatients,
  filteredAppointments,
  filteredInvoices,
  onSelectPatient,
  onSelectAppointment,
  onSelectInvoice,
}: CommandSearchResultsProps) {
  return (
    <>
      {q && !hasResults && (
        <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
          No se encontraron resultados para &ldquo;<span className="font-medium text-foreground">{search}</span>&rdquo;.
        </Command.Empty>
      )}

      {filteredPatients.length > 0 && (
        <Command.Group 
          heading={q ? "Pacientes Coincidentes" : "Pacientes Recientes"} 
          className="text-xs font-bold text-muted-foreground px-2 py-2"
        >
          {filteredPatients.map((p) => (
            <Command.Item
              key={p.id}
              value={p.id}
              onSelect={() => onSelectPatient(p.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-foreground transition-colors mt-1"
            >
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold truncate">{p.full_name}</span>
                {p.document_id && (
                  <span className="text-xs text-muted-foreground">C.I. {p.document_id}</span>
                )}
              </div>
            </Command.Item>
          ))}
        </Command.Group>
      )}

      {filteredAppointments.length > 0 && (
        <Command.Group 
          heading={q ? "Citas Coincidentes" : "Próximas Citas"} 
          className="text-xs font-bold text-muted-foreground px-2 py-2"
        >
          {filteredAppointments.map((a) => (
            <Command.Item
              key={a.id}
              value={a.id}
              onSelect={onSelectAppointment}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-foreground transition-colors mt-1"
            >
              <div className="h-8 w-8 bg-secondary/10 rounded-full flex items-center justify-center text-secondary shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold truncate">Cita con {a.patient_name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(a.scheduled_at).toLocaleDateString()} {new Date(a.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </Command.Item>
          ))}
        </Command.Group>
      )}

      {filteredInvoices.length > 0 && (
        <Command.Group heading="Facturas Coincidentes" className="text-xs font-bold text-muted-foreground px-2 py-2">
          {filteredInvoices.map((f) => (
            <Command.Item
              key={f.id_factura}
              value={f.id_factura.toString()}
              onSelect={onSelectInvoice}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-foreground transition-colors mt-1"
            >
              <div className="h-8 w-8 bg-mauve/10 rounded-full flex items-center justify-center text-mauve shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold">INV-{f.id_factura.toString().padStart(4, '0')}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {f.pacientes ? `${f.pacientes.nombre} ${f.pacientes.apellido}` : "Paciente Desconocido"} - ${f.total_general}
                </span>
              </div>
            </Command.Item>
          ))}
        </Command.Group>
      )}
    </>
  );
}
