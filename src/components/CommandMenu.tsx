import { useEffect, useState, useDeferredValue } from "react";
import { Command } from "cmdk";
import { Search, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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

  const { q, hasResults, filteredPatients, filteredAppointments, filteredInvoices } =
    useCommandMenuData(open, deferredSearch);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch("");
    }
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => {
          const next = !prev;
          if (!next) setSearch("");
          return next;
        });
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          hideCloseButton
          className="top-[15vh] translate-y-0 p-0 gap-0 max-w-lg bg-card text-card-foreground rounded-2xl shadow-2xl border border-border overflow-hidden"
        >
          <DialogTitle className="sr-only">Buscador global</DialogTitle>
          <DialogDescription className="sr-only">
            Busca pacientes, citas, facturas o ejecuta acciones rápidas.
          </DialogDescription>
          <Command
            shouldFilter={false}
            className="w-full overscroll-contain flex flex-col"
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
                    handleOpenChange(false);
                  }}
                  onNewPatient={() => {
                    navigate({ to: "/pacientes" });
                    handleOpenChange(false);
                  }}
                  onOpenVerification={() => {
                    handleOpenChange(false);
                    setIsVerificationOpen(true);
                  }}
                  onOpenLegal={() => {
                    navigate({ to: "/legal", search: { doc: "terminos" } });
                    handleOpenChange(false);
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
                  handleOpenChange(false);
                }}
                onSelectAppointment={() => {
                  navigate({ to: "/agenda" });
                  handleOpenChange(false);
                }}
                onSelectInvoice={() => {
                  navigate({ to: "/facturacion" });
                  handleOpenChange(false);
                }}
              />
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>

      <RecipeVerificationModal open={isVerificationOpen} onOpenChange={setIsVerificationOpen} />
    </>
  );
}
