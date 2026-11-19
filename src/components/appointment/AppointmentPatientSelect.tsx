import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { usePaginatedPatients, usePatient } from "@/lib/api/patients";

interface AppointmentPatientSelectProps {
  value: string;
  onChange: (patientId: string) => void;
}

export function AppointmentPatientSelect({ value, onChange }: AppointmentPatientSelectProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: selectedPatient } = usePatient(value || undefined);
  const { data: paginatedData } = usePaginatedPatients(1, 15, searchTerm || undefined);

  const selectedPatientName = selectedPatient?.full_name || "Selecciona paciente...";

  const filteredPatients = useMemo(() => {
    const list = paginatedData?.data || [];
    if (!searchTerm && selectedPatient && !list.some((p) => p.id === value)) {
      return [selectedPatient, ...list].slice(0, 15);
    }
    return list;
  }, [paginatedData, selectedPatient, searchTerm, value]);

  return (
    <div className="grid gap-2">
      <Label>Paciente</Label>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={popoverOpen}
            className="w-full justify-between rounded-xl font-normal text-xs h-10 border-border/30 bg-muted/40 hover:bg-muted/60 text-left px-3"
          >
            <span className="truncate">{selectedPatientName}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-border/40 shadow-lg" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar paciente por nombre, cédula o historia…"
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="text-xs h-9"
            />
            <CommandList className="max-h-[200px] overflow-y-auto">
              <CommandEmpty className="text-xs text-muted-foreground p-3 text-center">
                No se encontraron pacientes.
              </CommandEmpty>
              <CommandGroup>
                {filteredPatients.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.id}
                    onSelect={() => {
                      onChange(p.id);
                      setPopoverOpen(false);
                      setSearchTerm("");
                    }}
                    className="text-xs rounded-xl flex items-center justify-between cursor-pointer p-2 hover:bg-mauve/10"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-semibold truncate">{p.full_name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        C.I. {p.document_id || "—"} {p.historia_number && `· #${p.historia_number}`}
                      </span>
                    </div>
                    {value === p.id && (
                      <Check className="h-4 w-4 text-mauve shrink-0 ml-2" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
