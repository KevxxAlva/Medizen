import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, UserPlus, Loader2, X, Phone, CreditCard, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { usePaginatedPatients, usePatient, useCreatePatient, type Patient } from "@/lib/api/patients";
import { toast } from "sonner";

interface AppointmentPatientSelectProps {
  value: string;
  doctorId?: string;
  onChange: (patientId: string) => void;
  onPatientResolved?: (patient: Patient | null) => void;
}

function QuickPatientCreateCard({
  quickName,
  setQuickName,
  quickDocId,
  setQuickDocId,
  quickPhone,
  setQuickPhone,
  isPending,
  onCancel,
  onSubmit,
}: {
  quickName: string;
  setQuickName: (v: string) => void;
  quickDocId: string;
  setQuickDocId: (v: string) => void;
  quickPhone: string;
  setQuickPhone: (v: string) => void;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-3.5 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <UserPlus className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-extrabold text-foreground">
            Registro Rápido de Paciente
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="h-6 w-6 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Cancelar registro rápido"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid gap-2.5">
        <div className="grid gap-1">
          <Label className="text-[11px] font-semibold text-muted-foreground">Nombre y Apellido *</Label>
          <Input
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            placeholder="Ej. María Fernanda López"
            className="h-9 rounded-xl text-xs bg-background"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="grid gap-1">
            <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <CreditCard className="h-3 w-3" /> Cédula (opcional)
            </Label>
            <Input
              value={quickDocId}
              onChange={(e) => setQuickDocId(e.target.value)}
              placeholder="Ej. V-24123456"
              className="h-9 rounded-xl text-xs bg-background"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" /> Teléfono / WhatsApp
            </Label>
            <Input
              value={quickPhone}
              onChange={(e) => setQuickPhone(e.target.value)}
              placeholder="Ej. 0414-1234567"
              className="h-9 rounded-xl text-xs bg-background"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-8 rounded-xl text-xs">
          Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isPending || !quickName.trim()}
          onClick={onSubmit}
          className="h-8 rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:opacity-95"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Guardar y Seleccionar
        </Button>
      </div>
    </div>
  );
}

export function AppointmentPatientSelect({
  value,
  doctorId,
  onChange,
  onPatientResolved,
}: AppointmentPatientSelectProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickDocId, setQuickDocId] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [justCreatedPatient, setJustCreatedPatient] = useState<Patient | null>(null);

  const { data: fetchedSelectedPatient } = usePatient(value || undefined);
  const { data: paginatedData } = usePaginatedPatients(1, 15, searchTerm || undefined);
  const createPatient = useCreatePatient();

  const selectedPatient = useMemo(() => {
    if (fetchedSelectedPatient && fetchedSelectedPatient.id === value) return fetchedSelectedPatient;
    if (justCreatedPatient && justCreatedPatient.id === value) return justCreatedPatient;
    return paginatedData?.data?.find((p) => p.id === value) || null;
  }, [fetchedSelectedPatient, justCreatedPatient, paginatedData, value]);

  const filteredPatients = useMemo(() => {
    const list = paginatedData?.data || [];
    if (!searchTerm && selectedPatient && !list.some((p) => p.id === value)) {
      return [selectedPatient, ...list].slice(0, 15);
    }
    return list;
  }, [paginatedData, selectedPatient, searchTerm, value]);

  const openQuickCreate = () => {
    const trimmed = searchTerm.trim();
    const isDocPattern = /^[vVeEjJ]?-?\d+$/.test(trimmed);
    setQuickDocId(trimmed && isDocPattern ? trimmed : "");
    setQuickName(trimmed && !isDocPattern ? trimmed : "");
    setQuickPhone("");
    setPopoverOpen(false);
    setQuickCreateOpen(true);
  };

  const handleQuickCreate = async () => {
    if (createPatient.isPending) return;
    const cleanName = quickName.trim();
    if (!cleanName) {
      toast.error("Ingresa el nombre completo del paciente");
      return;
    }
    try {
      const created = await createPatient.mutateAsync({
        full_name: cleanName,
        document_id: quickDocId.trim() || null,
        phone: quickPhone.trim() || null,
        assigned_doctor_id: doctorId || "",
        status: "nuevo",
      });
      setJustCreatedPatient(created);
      onChange(created.id);
      onPatientResolved?.(created);
      setQuickCreateOpen(false);
      setSearchTerm("");
      toast.success(`Paciente ${created.full_name} registrado y seleccionado`);
    } catch (err: any) {
      toast.error(err?.message || "No se pudo registrar el paciente");
    }
  };

  const patientSubLabel = [
    selectedPatient?.document_id ? `C.I. ${selectedPatient.document_id}` : "",
    selectedPatient?.phone || "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-bold text-foreground">Paciente *</Label>
        {!quickCreateOpen && (
          <button
            type="button"
            onClick={openQuickCreate}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Registro rápido
          </button>
        )}
      </div>

      {quickCreateOpen ? (
        <QuickPatientCreateCard
          quickName={quickName}
          setQuickName={setQuickName}
          quickDocId={quickDocId}
          setQuickDocId={setQuickDocId}
          quickPhone={quickPhone}
          setQuickPhone={setQuickPhone}
          isPending={createPatient.isPending}
          onCancel={() => setQuickCreateOpen(false)}
          onSubmit={handleQuickCreate}
        />
      ) : (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={popoverOpen}
              className="w-full justify-between rounded-xl font-medium text-xs h-11 border-border/50 bg-background hover:bg-muted/40 text-left px-3.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <UserRound className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={selectedPatient ? "truncate font-semibold text-foreground" : "truncate text-muted-foreground"}>
                    {selectedPatient?.full_name || "Buscar o seleccionar paciente..."}
                  </span>
                  {patientSubLabel && (
                    <span className="text-[10px] text-muted-foreground truncate">{patientSubLabel}</span>
                  )}
                </div>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-border/50 shadow-xl z-[70]"
            align="start"
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Buscar paciente por nombre, cédula o historia…"
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="text-xs h-10"
              />
              <CommandList className="max-h-[220px] overflow-y-auto">
                <CommandEmpty className="p-3 text-center space-y-2.5">
                  <p className="text-xs text-muted-foreground">
                    No se encontraron pacientes{searchTerm ? ` para "${searchTerm}"` : ""}.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={openQuickCreate}
                    className="rounded-xl h-8 text-xs font-bold gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Crear &quot;{searchTerm.trim() || "paciente nuevo"}&quot; rápido
                  </Button>
                </CommandEmpty>
                <CommandGroup>
                  {filteredPatients.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.id}
                      onSelect={() => {
                        onChange(p.id);
                        onPatientResolved?.(p);
                        setPopoverOpen(false);
                        setSearchTerm("");
                      }}
                      className="text-xs rounded-xl flex items-center justify-between cursor-pointer p-2.5 hover:bg-primary/5"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-semibold truncate">{p.full_name}</span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          C.I. {p.document_id || "—"}
                          {p.phone ? ` · ${p.phone}` : ""}
                          {p.historia_number ? ` · #${p.historia_number}` : ""}
                        </span>
                      </div>
                      {value === p.id && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
              <div className="border-t border-border/50 p-2 bg-muted/20">
                <button
                  type="button"
                  onClick={openQuickCreate}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  + Registrar nuevo paciente rápido
                </button>
              </div>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
