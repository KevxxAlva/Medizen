import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  X,
  ChevronLeft,
  Filter,
  Wallet,
  Loader2,
  Landmark,
  Banknote,
  Coins,
  Layers,
  Sparkles,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TableRowActions } from "@/components/ui/table-row-actions";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useSyncVenezuelanAccountsAndMethods,
  VE_ACCOUNT_TYPES,
  normalizeAccountType,
  getAccountTypeInfo,
  type FinancialAccount as Account,
  type VeAccountCategory,
  type AccountMetadata,
} from "@/lib/api/accounts";
import {
  usePaymentMethods,
  VENEZUELAN_BANKS,
  inferCategoryFromMethod,
} from "@/lib/api/paymentMethods";
import {
  getCategoryIcon,
  getCategoryBadgeStyle,
} from "@/components/finance/PaymentMethodsPage";
import { useExchangeRate, formatBs, RATE_LABELS } from "@/hooks/useExchangeRate";
import { toast } from "sonner";

function getAccountIcon(type: string, name = "") {
  const norm = normalizeAccountType(type, name);
  switch (norm) {
    case "Bank":
      return Landmark;
    case "Cash":
      return Banknote;
    case "CashVES":
      return Wallet;
    case "Digital":
      return Coins;
    case "Cashea":
      return Layers;
    default:
      return Wallet;
  }
}

export function AccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: methods = [] } = usePaymentMethods();
  const createAcc = useCreateAccount();
  const updateAcc = useUpdateAccount();
  const deleteAcc = useDeleteAccount();
  const syncVeAccounts = useSyncVenezuelanAccountsAndMethods();
  const { rates, rate, activeType } = useExchangeRate();

  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Mapa de métodos de pago vinculados a cada cuenta (o sugeridos por categoría si no tienen cuenta asignada aún)
  const methodsByAccount = useMemo(() => {
    const map = new Map<string, Array<{ name: string; category: string; isExplicit: boolean }>>();
    for (const acc of accounts) {
      map.set(acc.id, []);
    }

    for (const m of methods) {
      const cat = inferCategoryFromMethod(m.name, m.category);
      if (m.account_id && map.has(m.account_id)) {
        map.get(m.account_id)!.push({
          name: m.name,
          category: cat,
          isExplicit: true,
        });
      }
    }

    // Si una cuenta no tiene métodos vinculados explícitamente aún, mostramos qué métodos corresponden a su naturaleza
    for (const acc of accounts) {
      const list = map.get(acc.id) || [];
      if (list.length === 0) {
        const normType = normalizeAccountType(acc.type, acc.name);
        if (normType === "Bank") {
          list.push(
            { name: "Pago Móvil", category: "Pago Móvil", isExplicit: false },
            { name: "Transferencia", category: "Transferencia", isExplicit: false }
          );
        } else if (normType === "Cash") {
          list.push(
            { name: "Divisas ($ / €)", category: "Divisas", isExplicit: false },
            { name: "Efectivo", category: "Efectivo", isExplicit: false }
          );
        } else if (normType === "CashVES") {
          list.push({ name: "Efectivo (Bs.)", category: "Efectivo", isExplicit: false });
        } else if (normType === "Digital") {
          list.push({ name: "Binance (USDT)", category: "Binance", isExplicit: false });
        } else if (normType === "Cashea") {
          list.push({ name: "Cashea (Cuotas)", category: "Cashea", isExplicit: false });
        }
        map.set(acc.id, list);
      }
    }

    return map;
  }, [accounts, methods]);

  // Estadísticas de Tesorería por tipo de cuenta
  const treasuryStats = useMemo(() => {
    let totalAll = 0;
    let totalBankBs = 0;
    let totalCash = 0;
    let totalDigitalAndCashea = 0;

    for (const a of accounts) {
      if (a.status !== "Active") continue;
      const bal = Number(a.balance) || 0;
      totalAll += bal;
      const norm = normalizeAccountType(a.type, a.name);
      if (norm === "Bank") {
        totalBankBs += bal;
      } else if (norm === "Cash" || norm === "CashVES") {
        totalCash += bal;
      } else {
        totalDigitalAndCashea += bal;
      }
    }

    return {
      totalAll,
      totalBankBs,
      totalCash,
      totalDigitalAndCashea,
    };
  }, [accounts]);

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const normType = normalizeAccountType(a.type, a.name);
      const typeInfo = getAccountTypeInfo(normType, a.name);
      if (q) {
        const term = q.toLowerCase();
        const matchName = a.name.toLowerCase().includes(term);
        const matchType = typeInfo.label.toLowerCase().includes(term);
        const matchBank = (a.meta?.bankName || "").toLowerCase().includes(term);
        if (!matchName && !matchType && !matchBank) {
          return false;
        }
      }
      if (filterType !== "all" && normType !== filterType) return false;
      if (filterStatus !== "all" && a.status !== filterStatus) return false;
      return true;
    });
  }, [accounts, q, filterType, filterStatus]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "¿Estás seguro de que deseas eliminar esta cuenta financiera? (Los métodos de pago asociados se desvincularán automáticamente)"
      )
    ) {
      try {
        await deleteAcc.mutateAsync(id);
        toast.success("Cuenta eliminada correctamente");
      } catch (err: any) {
        toast.error(err?.message || "Error al eliminar la cuenta");
      }
    }
  };

  const handleSyncVenezuela = async () => {
    try {
      await syncVeAccounts.mutateAsync({ accounts, methods });
      toast.success(
        "Cuentas y Métodos de Venezuela (Efectivo, Pago Móvil, Transferencia, Binance, Divisas y Cashea) sincronizados y vinculados"
      );
    } catch {
      toast.error("Error al sincronizar cuentas y métodos");
    }
  };

  const handleSave = async (accData: {
    name: string;
    type: string;
    balance: number;
    status: "Active" | "Inactive";
    meta?: AccountMetadata;
    id?: string;
  }) => {
    try {
      if (accData.id) {
        await updateAcc.mutateAsync(accData as Account);
        toast.success("Cuenta actualizada correctamente");
      } else {
        await createAcc.mutateAsync(accData);
        toast.success("Cuenta añadida correctamente");
      }
      setFormOpen(false);
    } catch {
      toast.error("Error al guardar la cuenta");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-xs min-h-[calc(100vh-8rem)] font-sans flex flex-col">
      {/* TOP HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
            title="Volver"
            aria-label="Volver"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Cuentas y Tesorería (Venezuela)
            </h1>
            <p className="text-xs text-muted-foreground">
              Control de Bancos Nacionales (Bs.), Caja de Divisas ($), Efectivo, Binance USDT y Cartera Cashea
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled={syncVeAccounts.isPending}
            onClick={handleSyncVenezuela}
            className="rounded-xl text-xs font-bold border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 gap-1.5 cursor-pointer"
          >
            {syncVeAccounts.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Vincular Cuentas VE
          </Button>
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Añadir Cuenta
          </Button>
        </div>
      </header>

      {/* TARJETAS DE RESUMEN DE TESORERÍA MULTIMONEDA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <button
          type="button"
          onClick={() => {
            setFilterType("all");
            setCurrentPage(1);
          }}
          className={cn(
            "text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3",
            filterType === "all"
              ? "bg-primary/10 border-primary/40 shadow-2xs"
              : "bg-muted/20 border-border/60 hover:bg-muted/40"
          )}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Total en Tesorería
            </span>
            <p className="text-xl font-black text-foreground">
              ${treasuryStats.totalAll.toFixed(2)} <span className="text-xs font-bold text-muted-foreground">USD</span>
            </p>
            <p className="text-xs font-bold text-primary">
              ≈ {formatBs(treasuryStats.totalAll, rates.bcv)} (BCV)
            </p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <TrendingUp className="h-4 w-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterType((prev) => (prev === "Bank" ? "all" : "Bank"));
            setCurrentPage(1);
          }}
          className={cn(
            "text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3",
            filterType === "Bank"
              ? "bg-blue-500/10 border-blue-500/40 shadow-2xs"
              : "bg-muted/20 border-border/60 hover:bg-muted/40"
          )}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Bancos Nacionales (Pago Móvil / Transf.)
            </span>
            <p className="text-xl font-black text-blue-600 dark:text-blue-400">
              ${treasuryStats.totalBankBs.toFixed(2)}
            </p>
            <p className="text-xs font-bold text-muted-foreground">
              {formatBs(treasuryStats.totalBankBs, rates.bcv)}
            </p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Landmark className="h-4 w-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterType((prev) => (prev === "Cash" ? "all" : "Cash"));
            setCurrentPage(1);
          }}
          className={cn(
            "text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3",
            filterType === "Cash"
              ? "bg-emerald-500/10 border-emerald-500/40 shadow-2xs"
              : "bg-muted/20 border-border/60 hover:bg-muted/40"
          )}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Cajas Físicas (Divisas $ / Efectivo Bs.)
            </span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              ${treasuryStats.totalCash.toFixed(2)}
            </p>
            <p className="text-xs font-bold text-muted-foreground">
              {formatBs(treasuryStats.totalCash, rates.bcv)}
            </p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Banknote className="h-4 w-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterType((prev) => (prev === "Digital" ? "all" : "Digital"));
            setCurrentPage(1);
          }}
          className={cn(
            "text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3",
            filterType === "Digital" || filterType === "Cashea"
              ? "bg-amber-500/10 border-amber-500/40 shadow-2xs"
              : "bg-muted/20 border-border/60 hover:bg-muted/40"
          )}
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Binance (USDT) / Digital / Cashea
            </span>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400">
              ${treasuryStats.totalDigitalAndCashea.toFixed(2)}
            </p>
            <p className="text-xs font-bold text-muted-foreground">
              ≈ {formatBs(treasuryStats.totalDigitalAndCashea, rates.usdt)} (USDT)
            </p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Coins className="h-4 w-4" />
          </div>
        </button>
      </div>

      {/* SECONDARY TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-border pb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <Wallet className="h-4 w-4 text-primary" /> {filtered.length} cuentas registradas
          <span className="text-xs font-normal text-muted-foreground hidden lg:inline">
            · Tasa activa ({RATE_LABELS[activeType].short}): Bs. {rate.toFixed(2)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 flex-1 sm:flex-initial justify-end">
          <div className="flex items-center gap-2 rounded-xl bg-muted border border-border px-3.5 py-2 w-full sm:w-72">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar cuenta, banco o moneda…"
              aria-label="Buscar cuentas"
              className="w-full bg-transparent text-xs focus-visible:outline-none placeholder:text-muted-foreground text-foreground"
            />
            {q && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setQ("")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <AccountsFilterPopover
            filterType={filterType}
            setFilterType={(v) => {
              setFilterType(v);
              setCurrentPage(1);
            }}
            filterStatus={filterStatus}
            setFilterStatus={(v) => {
              setFilterStatus(v);
              setCurrentPage(1);
            }}
            onReset={() => {
              setFilterType("all");
              setFilterStatus("all");
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-x-auto border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-muted/70 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
              <th className="p-4">Nombre de Cuenta / Bóveda</th>
              <th className="p-4">Categoría y Moneda</th>
              <th className="p-4">Métodos de Pago que Recibe</th>
              <th className="p-4">Balance ($ USD / Equiv. Bs.)</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-12 text-center text-muted-foreground font-medium"
                >
                  No se encontraron cuentas financieras.
                </td>
              </tr>
            ) : (
              paginated.map((a) => {
                const normType = normalizeAccountType(a.type, a.name);
                const typeInfo = getAccountTypeInfo(normType, a.name);
                const Icon = getAccountIcon(normType, a.name);
                const linkedMethods = methodsByAccount.get(a.id) || [];
                const refRate =
                  normType === "Digital" ? rates.usdt : rates.bcv;

                return (
                  <tr
                    key={a.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-9 w-9 rounded-xl border flex items-center justify-center shrink-0",
                            typeInfo.badgeClass
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{a.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {a.meta?.bankName ||
                              a.meta?.notes ||
                              typeInfo.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2.5 py-0.5 rounded-full border w-fit",
                            typeInfo.badgeClass
                          )}
                        >
                          {typeInfo.shortLabel}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          Moneda base:{" "}
                          {normType === "Bank" || normType === "CashVES"
                            ? "Bolívares (VES · BCV)"
                            : normType === "Digital"
                            ? "USDT / Digital"
                            : "Dólares ($ USD)"}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-[270px]">
                        {linkedMethods.map((lm, idx) => {
                          const MIcon = getCategoryIcon(lm.category);
                          return (
                            <span
                              key={`${a.id}-${lm.name}-${idx}`}
                              className={cn(
                                "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                getCategoryBadgeStyle(lm.category)
                              )}
                              title={
                                lm.isExplicit
                                  ? `Método vinculado: ${lm.name}`
                                  : `Recibe pagos de: ${lm.name}`
                              }
                            >
                              <MIcon className="h-3 w-3 shrink-0" />
                              {lm.name}
                            </span>
                          );
                        })}
                        {linkedMethods.length === 0 && (
                          <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                            <CreditCard className="h-3 w-3" /> Sin métodos asignados
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="inline-block bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black px-3 py-1 text-xs rounded-full border border-emerald-500/20">
                          ${a.balance.toFixed(2)}{" "}
                          {normType === "Digital" ? "USDT" : "USD"}
                        </span>
                        <p className="text-[11px] font-bold text-muted-foreground pl-1">
                          ≈ {formatBs(a.balance, refRate)}
                        </p>
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide",
                          a.status === "Active"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {a.status === "Active" ? "Activa" : "Inactiva"}
                      </span>
                    </td>

                    <TableRowActions
                      editLabel={`Editar cuenta ${a.name}`}
                      deleteLabel={`Eliminar cuenta ${a.name}`}
                      onEdit={() => {
                        setEditing(a);
                        setFormOpen(true);
                      }}
                      onDelete={() => handleDelete(a.id)}
                    />
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        entityLabel="cuentas"
        onPageChange={setCurrentPage}
      />

      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSave={handleSave}
        isPending={createAcc.isPending || updateAcc.isPending}
      />
    </div>
  );
}

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Account | null;
  onSave: (data: {
    name: string;
    type: string;
    balance: number;
    status: "Active" | "Inactive";
    meta?: AccountMetadata;
    id?: string;
  }) => Promise<void>;
  isPending: boolean;
}

function AccountFormDialog({
  open,
  onOpenChange,
  editing,
  onSave,
  isPending,
}: AccountFormDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<VeAccountCategory>("Bank");
  const [balance, setBalance] = useState("0");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [bankName, setBankName] = useState("");
  const [notes, setNotes] = useState("");

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      if (editing) {
        const norm = normalizeAccountType(editing.type, editing.name);
        setName(editing.name);
        setType(norm);
        setBalance(String(editing.balance ?? 0));
        setStatus(editing.status);
        setBankName(editing.meta?.bankName || "");
        setNotes(editing.meta?.notes || "");
      } else {
        setName("");
        setType("Bank");
        setBalance("0");
        setStatus("Active");
        setBankName("");
        setNotes("");
      }
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    const typeInfo = getAccountTypeInfo(type, name);
    await onSave({
      name: name.trim(),
      type,
      balance: parseFloat(balance) || 0,
      status,
      meta: {
        currency: typeInfo.currency,
        bankName: bankName || undefined,
        notes: notes || undefined,
      },
      id: editing?.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? `Editar ${editing.name}` : "Añadir Cuenta / Caja Financiera"}
          </DialogTitle>
          <DialogDescription>
            Configura dónde se reciben y custodian los cobros de la clínica (Bancos Bs., Caja Divisas, Efectivo Bs., Binance USDT o Cashea).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="acc-type" className="text-xs font-bold text-foreground">
              TIPO DE CUENTA EN VENEZUELA
            </Label>
            <select
              id="acc-type"
              value={type}
              onChange={(e) => {
                const nextType = e.target.value as VeAccountCategory;
                setType(nextType);
                if (!editing && !name) {
                  const found = VE_ACCOUNT_TYPES.find((t) => t.value === nextType);
                  if (found) setName(found.shortLabel);
                }
              }}
              className="w-full h-10 px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs font-bold outline-none"
            >
              {VE_ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acc-name" className="text-xs font-bold text-foreground">
              NOMBRE DE LA CUENTA / CAJA *
            </Label>
            <Input
              id="acc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Cuenta Bancamiga (Bs.) o Caja Divisas ($)"
              required
              className="rounded-xl bg-muted/50"
            />
          </div>

          {type === "Bank" && (
            <div className="space-y-1.5">
              <Label htmlFor="acc-bank" className="text-xs font-bold text-foreground">
                BANCO NACIONAL (VENEZUELA)
              </Label>
              <select
                id="acc-bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full h-10 px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs font-semibold outline-none"
              >
                <option value="">-- Seleccionar Banco (Opcional) --</option>
                {VENEZUELAN_BANKS.map((b) => (
                  <option key={b.code} value={`${b.code} - ${b.name}`}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="acc-balance" className="text-xs font-bold text-foreground">
                BALANCE ACTUAL ($ USD / USDT) *
              </Label>
              <Input
                id="acc-balance"
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                required
                className="rounded-xl bg-muted/50 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acc-status" className="text-xs font-bold text-foreground">
                ESTADO
              </Label>
              <select
                id="acc-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
                className="w-full h-10 px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs font-bold outline-none"
              >
                <option value="Active">Activa</option>
                <option value="Inactive">Inactiva</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acc-notes" className="text-xs font-bold text-foreground">
              DESCRIPCIÓN / NOTAS DE USO
            </Label>
            <Input
              id="acc-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Recibe todos los cobros de Pago Móvil y Transferencias"
              className="rounded-xl bg-muted/50 text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-primary text-primary-foreground cursor-pointer"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Guardar Cambios" : "Crear Cuenta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface AccountsFilterPopoverProps {
  filterType: string;
  setFilterType: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  onReset: () => void;
}

function AccountsFilterPopover({
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  onReset,
}: AccountsFilterPopoverProps) {
  const isFiltered = filterType !== "all" || filterStatus !== "all";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-bold text-foreground border border-border/40 rounded-xl hover:bg-muted transition-colors cursor-pointer",
            isFiltered && "bg-primary/10 border-primary text-primary"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          {isFiltered ? "Filtrado" : "Filtros"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 rounded-2xl glass-card border-0 shadow-2xl p-4" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Categoría de Cuenta
            </h4>
            <select
              aria-label="Filtrar por tipo de cuenta"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-background border border-input text-xs font-semibold outline-none"
            >
              <option value="all">Todas las categorías</option>
              {VE_ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.shortLabel}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Estado
            </h4>
            <select
              aria-label="Filtrar por estado"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-background border border-input text-xs font-semibold outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="Active">Activa</option>
              <option value="Inactive">Inactiva</option>
            </select>
          </div>
          {isFiltered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="w-full rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
