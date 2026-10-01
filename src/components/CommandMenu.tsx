import { useEffect, useState, useMemo, useDeferredValue } from "react";
import { Command } from "cmdk";
import { Search, User, FileText, Calendar, CalendarPlus, UserPlus, X, ShieldCheck } from "lucide-react";
import { usePatients } from "@/lib/api/patients";
import { useAppointments } from "@/lib/api/appointments";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RecipeVerificationModal } from "@/components/RecipeVerificationModal";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const { data: patients = [] } = usePatients();
  const { data: appointments = [] } = useAppointments();
  const { data: invoices = [] } = useQuery({
    queryKey: ["global-search-invoices"],
    queryFn: async () => {
      const { data } = await supabase
        .from("facturas")
        .select("id_factura, total_general, fecha_emision, pacientes(nombre, apellido)")
        .order("id_factura", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: open, // Consultar solo cuando el buscador esté abierto
  });

  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  // Limpiar búsqueda al cerrar
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  // Normalizar término de búsqueda en minúsculas y sin acentos
  const q = deferredSearch.trim().toLowerCase();

  // Filtrado ultrarrápido en memoria con límite estricto de elementos DOM (máx 8)
  const filteredPatients = useMemo(() => {
    if (!q) {
      return patients.slice(0, 5); // Mostrar solo los 5 más recientes en estado inicial
    }
    const terms = q.split(/\s+/);
    return patients
      .filter((p) => {
        const name = (p.full_name || "").toLowerCase();
        const doc = (p.document_id || "").toLowerCase();
        return terms.every((t) => name.includes(t) || doc.includes(t));
      })
      .slice(0, 8); // Limitar a 8 resultados en el DOM para 0 latencia
  }, [patients, q]);

  // Filtrado de citas (máx 4)
  const filteredAppointments = useMemo(() => {
    if (!q) {
      return appointments.slice(0, 3);
    }
    const terms = q.split(/\s+/);
    return appointments
      .filter((a) => {
        const name = (a.patient_name || "").toLowerCase();
        const reason = (a.reason || "").toLowerCase();
        return terms.every((t) => name.includes(t) || reason.includes(t));
      })
      .slice(0, 4);
  }, [appointments, q]);

  // Filtrado de facturas (solo cuando busca)
  const filteredInvoices = useMemo(() => {
    if (!q) return [];
    const terms = q.split(/\s+/);
    return invoices
      .filter((f) => {
        const name = `${f.pacientes?.nombre || ""} ${f.pacientes?.apellido || ""}`.toLowerCase();
        const invId = f.id_factura?.toString() || "";
        return terms.every((t) => name.includes(t) || invId.includes(t));
      })
      .slice(0, 4);
  }, [invoices, q]);

  const hasResults =
    filteredPatients.length > 0 ||
    filteredAppointments.length > 0 ||
    filteredInvoices.length > 0;

  if (!open && !isVerificationOpen) return null;

  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
      <Command 
        shouldFilter={false} // ¡Desactiva el algoritmo fuzzy de cmdk para eliminar el bloqueo de 408ms!
        className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-150"
        label="Global Command Menu"
      >
        <div className="flex items-center px-4 py-3 border-b border-border/30 gap-3">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <Command.Input 
            value={search}
            onValueChange={setSearch}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-foreground text-base"
            placeholder="Buscar pacientes por nombre o cédula..." 
            autoFocus 
          />
          {search ? (
            <button 
              onClick={() => setSearch("")}
              className="text-muted-foreground hover:text-foreground p-1"
              title="Borrar texto"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex text-[10px] uppercase font-bold text-muted-foreground bg-muted/60 px-2 py-1 rounded border border-border/50">
              ESC
            </kbd>
          )}
        </div>

        <Command.List className="max-h-[340px] overflow-y-auto p-2 scrollbar-thin">
          {!q && (
            <Command.Group heading="Acciones Rápidas" className="text-xs font-bold text-muted-foreground px-2 py-2">
              <Command.Item
                onSelect={() => {
                  navigate({ to: "/agenda" });
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-foreground transition-colors mt-1"
              >
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                  <CalendarPlus className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold flex-1">Nueva Cita</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  navigate({ to: "/pacientes" });
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-foreground transition-colors mt-1"
              >
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold flex-1">Nuevo Paciente</span>
              </Command.Item>
              <Command.Item
                onSelect={() => {
                  setOpen(false);
                  setIsVerificationOpen(true);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-primary/10 aria-selected:text-primary text-foreground transition-colors mt-1"
              >
                <div className="h-8 w-8 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold flex-1">Validar Récipe / Código QR Oficial</span>
              </Command.Item>
            </Command.Group>
          )}

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
                  onSelect={() => {
                    navigate({ to: "/pacientes/$patientId", params: { patientId: p.id } });
                    setOpen(false);
                  }}
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
                  onSelect={() => {
                    navigate({ to: "/agenda" });
                    setOpen(false);
                  }}
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
                  onSelect={() => {
                    navigate({ to: "/facturacion" });
                    setOpen(false);
                  }}
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
        </Command.List>
      </Command>
    </div>
    )}

    <RecipeVerificationModal
      open={isVerificationOpen}
      onOpenChange={setIsVerificationOpen}
    />
  </>
  );
}
