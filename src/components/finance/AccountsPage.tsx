import { useState, useMemo } from "react";
import { FinancePageHeader } from "./FinancePageHeader";
import {
  Search,
  Plus,
  X,
  Filter,
  Wallet,
  Loader2,
  Landmark,
  Banknote,
  Coins,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
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
  type AccountMetadata,
} from "@/lib/api/accounts";
import {
  usePaymentMethods,
  inferCategoryFromMethod,
} from "@/lib/api/paymentMethods";
import { useExchangeRate, formatBs, RATE_LABELS, type RateType } from "@/hooks/useExchangeRate";
import { toast } from "sonner";
import { AccountsTable } from "./AccountsTable";
import { AccountFormDialog } from "./AccountFormDialog";

function AccountsStatCards({
  filterType,
  setFilterType,
  setCurrentPage,
  treasuryStats,
  rates,
}: {
  filterType: string;
  setFilterType: React.Dispatch<React.SetStateAction<string>>;
  setCurrentPage: (p: number) => void;
  treasuryStats: {
    totalAll: number;
    totalBankBs: number;
    totalCash: number;
    totalDigitalAndCashea: number;
  };
  rates: { bcv: number; eur: number; usdt: number };
}) {
  return (
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
            ${treasuryStats.totalAll.toFixed(2)}{" "}
            <span className="text-xs font-bold text-muted-foreground">USD</span>
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
            Caja Chica (Divisas $ y Efectivo Bs.)
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
          filterType === "Digital"
            ? "bg-amber-500/10 border-amber-500/40 shadow-2xs"
            : "bg-muted/20 border-border/60 hover:bg-muted/40"
        )}
      >
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Digitales y Financiados (Binance USDT / Cashea)
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

function AccountsSecondaryToolbar({
  count,
  activeType,
  rate,
  q,
  setQ,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  setCurrentPage,
}: {
  count: number;
  activeType: RateType;
  rate: number;
  q: string;
  setQ: (v: string) => void;
  filterType: string;
  setFilterType: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  setCurrentPage: (p: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-border pb-3">
      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
        <Wallet className="h-4 w-4 text-primary" /> {count} cuentas registradas
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
              className="text-muted-foreground hover:text-foreground cursor-pointer"
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
  );
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
    <div className="bg-card border border-border rounded-3xl p-3.5 sm:p-6 shadow-xs min-h-[calc(100vh-8rem)] font-sans flex flex-col w-full min-w-0 overflow-hidden">
      <FinancePageHeader
        title="Cuentas y Tesorería (Venezuela)"
        subtitle="Control de Bancos Nacionales (Bs.), Caja de Divisas ($), Efectivo, Binance USDT y Cartera Cashea"
      >
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
      </FinancePageHeader>

      <AccountsStatCards
        filterType={filterType}
        setFilterType={setFilterType}
        setCurrentPage={setCurrentPage}
        treasuryStats={treasuryStats}
        rates={rates}
      />

      <AccountsSecondaryToolbar
        count={filtered.length}
        activeType={activeType}
        rate={rate}
        q={q}
        setQ={setQ}
        filterType={filterType}
        setFilterType={setFilterType}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        setCurrentPage={setCurrentPage}
      />

      <AccountsTable
        paginated={paginated}
        methodsByAccount={methodsByAccount}
        rates={rates}
        onEdit={(a) => {
          setEditing(a);
          setFormOpen(true);
        }}
        onDelete={handleDelete}
      />

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

export default AccountsPage;
