import { useEffect, useState, useDeferredValue } from "react";
import { Command } from "cmdk";
import { Search, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { RecipeVerificationModal } from "@/components/RecipeVerificationModal";
import { CommandQuickActions } from "./command/CommandQuickActions";
import { CommandSearchResults } from "./command/CommandSearchResults";
import { useCommandMenuData } from "./command/useCommandMenuData";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const navigate = useNavigate();

  const {
    q,
    hasResults,
    filteredPatients,
    filteredAppointments,
    filteredInvoices,
  } = useCommandMenuData(open, deferredSearch);

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

  if (!open && !isVerificationOpen) return null;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
          <button
            type="button"
            aria-label="Cerrar menú de comandos"
            className="fixed inset-0 bg-background/80 backdrop-blur-sm border-none cursor-default"
            onClick={() => setOpen(false)}
          />
          <Command
            shouldFilter={false} // ¡Desactiva el algoritmo fuzzy de cmdk para eliminar el bloqueo de 408ms!
            className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden overscroll-contain flex flex-col animate-in fade-in-0 zoom-in-95 duration-150"
            label="Global Command Menu"
          >
            <div className="flex items-center px-4 py-3 border-b border-border/30 gap-3">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-foreground text-base"
                placeholder="Buscar pacientes por nombre o cédula…"
                autoFocus
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Borrar texto"
                  className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
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

            <Command.List className="max-h-[340px] overflow-y-auto overscroll-contain p-2 scrollbar-thin">
              {!q && (
                <CommandQuickActions
                  onNewAppointment={() => {
                    navigate({ to: "/agenda" });
                    setOpen(false);
                  }}
                  onNewPatient={() => {
                    navigate({ to: "/pacientes" });
                    setOpen(false);
                  }}
                  onOpenVerification={() => {
                    setOpen(false);
                    setIsVerificationOpen(true);
                  }}
                />
              )}

              <CommandSearchResults
                q={q}
                search={search}
                hasResults={hasResults}
                filteredPatients={filteredPatients}
                filteredAppointments={filteredAppointments}
                filteredInvoices={filteredInvoices}
                onSelectPatient={(id) => {
                  navigate({ to: "/pacientes/$patientId", params: { patientId: id } });
                  setOpen(false);
                }}
                onSelectAppointment={() => {
                  navigate({ to: "/agenda" });
                  setOpen(false);
                }}
                onSelectInvoice={() => {
                  navigate({ to: "/facturacion" });
                  setOpen(false);
                }}
              />
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
