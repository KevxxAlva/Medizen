import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  X,
  Filter,
  CreditCard,
  Loader2,
  Smartphone,
  Landmark,
  Coins,
  Banknote,
  Wallet,
  Sparkles,
  Copy,
  Check,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TableRowActions } from "@/components/ui/table-row-actions";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  useSeedVenezuelanPaymentMethods,
  VE_PAYMENT_PRESETS,
  inferCategoryFromMethod,
  formatPaymentMethodCopyText,
  encodeCategoryWithDetails,
  decodeCategoryDetails,
  type PaymentMethod,
  type PaymentMethodDetails,
  type VePaymentCategory,
} from "@/lib/api/paymentMethods";
import { useAccounts, type FinancialAccount as Account } from "@/lib/api/accounts";
import { toast } from "sonner";
import { PaymentMethodFormDialog } from "./PaymentMethodFormDialog";
import { FinancePageHeader } from "./FinancePageHeader";

export function getCategoryIcon(category: string) {
  const cat = inferCategoryFromMethod("", category);
  switch (cat) {
    case "Pago Móvil":
      return Smartphone;
    case "Transferencia":
      return Landmark;
    case "Binance":
      return Coins;
    case "Divisas":
      return Banknote;
    case "Efectivo":
      return Wallet;
    case "Cashea":
      return Layers;
    default:
      return CreditCard;
  }
}

export function getCategoryBadgeStyle(category: string): string {
  const cat = inferCategoryFromMethod("", category);
  const preset = VE_PAYMENT_PRESETS.find((p) => p.category === cat);
  return preset?.badgeColor || "bg-primary/10 text-primary border-primary/20";
}

function getPresetSubtitle(preset: (typeof VE_PAYMENT_PRESETS)[0]) {
  if (preset.details.currency === "VES") return "Bolívares (Tasa BCV)";
  if (preset.details.currency === "USDT") return "Cripto USDT (Binance)";
  if (preset.category === "Cashea") {
    return `Inicial ${preset.details.casheaDefaultInitialPct}% + Cuotas`;
  }
  return "Dólares ($) / Euros (€)";
}

function PaymentMethodsPresetCards({
  methods,
  categoryFilter,
  setCategoryFilter,
  setCurrentPage,
  onOpenCreate,
}: {
  methods: PaymentMethod[];
  categoryFilter: string;
  setCategoryFilter: React.Dispatch<React.SetStateAction<string>>;
  setCurrentPage: (p: number) => void;
  onOpenCreate: (cat: VePaymentCategory) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5">
      {VE_PAYMENT_PRESETS.map((preset) => {
        const Icon = getCategoryIcon(preset.category);
        const existing = methods.find(
          (m) => inferCategoryFromMethod(m.name, m.category) === preset.category
        );
        const isFilterSelected = categoryFilter === preset.category;

        return (
          <button
            type="button"
            key={preset.category}
            onClick={() => {
              if (existing) {
                setCategoryFilter((prev) =>
                  prev === preset.category ? "all" : preset.category
                );
                setCurrentPage(1);
              } else {
                onOpenCreate(preset.category);
              }
            }}
            className={cn(
              "rounded-2xl border p-3 transition-colors cursor-pointer flex flex-col justify-between gap-2 text-left",
              isFilterSelected
                ? "border-primary bg-primary/10 shadow-xs"
                : existing
                ? "border-border/70 bg-muted/20 hover:bg-muted/40"
                : "border-dashed border-border bg-muted/10 hover:border-primary/40"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div
                className={cn(
                  "h-8 w-8 rounded-xl border flex items-center justify-center shrink-0",
                  preset.badgeColor
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              {existing ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Configurado
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  + Configurar
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground truncate">
                {preset.category}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {getPresetSubtitle(preset)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PaymentMethodDetailsCell({
  details,
  methodId,
  copiedId,
  onCopy,
}: {
  details: PaymentMethodDetails;
  methodId: string;
  copiedId: string | null;
  onCopy: () => void;
}) {
  const hasDetails = Boolean(
    details.phone || details.accountNumber || details.binanceId || details.instructions
  );

  return (
    <div className="flex items-center gap-2 max-w-[280px]">
      <div className="text-xs truncate">
        {details.phone && (
          <p className="font-semibold text-foreground truncate">
            Tel: <span className="font-mono">{details.phone}</span>
            {details.documentId && ` · ${details.documentId}`}
          </p>
        )}
        {details.accountNumber && (
          <p className="font-mono text-[11px] text-foreground truncate">
            {details.accountNumber}
          </p>
        )}
        {details.binanceId && (
          <p className="font-mono text-[11px] text-foreground truncate">
            Pay ID: {details.binanceId}
          </p>
        )}
        {details.holderName && (
          <p className="text-[11px] text-muted-foreground truncate">
            Titular: {details.holderName}
          </p>
        )}
        {details.instructions && !details.phone && !details.accountNumber && (
          <p className="text-[11px] text-muted-foreground truncate italic">
            {details.instructions}
          </p>
        )}
        {!hasDetails && (
          <span className="text-muted-foreground italic text-[11px]">
            Sin datos públicos configurados
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onCopy}
        title="Copiar datos de cobro para enviar al paciente"
        className="p-1.5 rounded-lg bg-muted hover:bg-primary/15 text-muted-foreground hover:text-primary transition cursor-pointer shrink-0"
      >
        {copiedId === methodId ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

function PaymentMethodAccountCell({ linkedAccount }: { linkedAccount?: Account }) {
  if (!linkedAccount) {
    return (
      <span className="text-muted-foreground/70 italic">
        Caja General (Sin vincular)
      </span>
    );
  }
  return (
    <span className="font-semibold text-foreground">
      {linkedAccount.name}{" "}
      <span className="text-emerald-600 dark:text-emerald-400">
        (${linkedAccount.balance.toFixed(2)})
      </span>
    </span>
  );
}

function PaymentMethodsTableRow({
  method: m,
  accounts,
  copiedId,
  onCopy,
  onEdit,
  onDelete,
}: {
  method: PaymentMethod;
  accounts: Account[];
  copiedId: string | null;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const normCategory = inferCategoryFromMethod(m.name, m.category);
  const Icon = getCategoryIcon(normCategory);
  const details = decodeCategoryDetails(m.category);
  const linkedAccount = accounts.find((a) => a.id === m.account_id);

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition group">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-9 w-9 rounded-xl border flex items-center justify-center shrink-0",
              getCategoryBadgeStyle(normCategory)
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-foreground">{m.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {details.bank
                ? `${details.bank} · `
                : details.binanceId
                ? `Binance ID: ${details.binanceId} · `
                : ""}
              {details.currency || "VES"} (Ref: {details.defaultRateType?.toUpperCase() || "BCV"})
            </p>
          </div>
        </div>
      </td>

      <td className="p-4">
        <span
          className={cn(
            "text-[10px] font-bold px-2.5 py-1 rounded-full border",
            getCategoryBadgeStyle(normCategory)
          )}
        >
          {normCategory}
        </span>
      </td>

      <td className="p-4">
        <PaymentMethodDetailsCell
          details={details}
          methodId={m.id}
          copiedId={copiedId}
          onCopy={onCopy}
        />
      </td>

      <td className="p-4 text-muted-foreground font-medium text-xs">
        <PaymentMethodAccountCell linkedAccount={linkedAccount} />
      </td>

      <td className="p-4">
        <span
          className={cn(
            "text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide",
            m.status === "Active"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-muted text-muted-foreground"
          )}
        >
          {m.status === "Active" ? "Activo" : "Inactivo"}
        </span>
      </td>

      <TableRowActions
        editLabel={`Editar método ${m.name}`}
        deleteLabel={`Eliminar método ${m.name}`}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </tr>
  );
}

function PaymentMethodsSecondaryToolbar({
  totalMethods,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  setCurrentPage,
}: {
  totalMethods: number;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  setCurrentPage: (p: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-border pb-3">
      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
        <CreditCard className="h-4 w-4 text-primary" /> {totalMethods} métodos registrados
        {categoryFilter !== "all" && (
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className="text-[11px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 cursor-pointer"
          >
            {categoryFilter} <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            aria-label="Filtrar por categoría"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 px-2.5 rounded-xl bg-muted border border-border text-xs font-semibold outline-none"
          >
            <option value="all">Todas las categorías</option>
            <option value="Pago Móvil">Pago Móvil</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Binance">Binance (USDT)</option>
            <option value="Divisas">Divisas ($ / €)</option>
            <option value="Efectivo">Efectivo (Bs.)</option>
            <option value="Cashea">Cashea</option>
            <option value="Punto de Venta">Punto de Venta</option>
          </select>

          <select
            aria-label="Filtrar por estado"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 px-2.5 rounded-xl bg-muted border border-border text-xs font-semibold outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="Active">Activos</option>
            <option value="Inactive">Inactivos</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodsHeaderActions({
  missingPresetsCount,
  isPending,
  onSeed,
  onOpenCreate,
}: {
  missingPresetsCount: number;
  isPending: boolean;
  onSeed: () => void;
  onOpenCreate: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {missingPresetsCount > 0 && (
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={onSeed}
          className="rounded-xl text-xs font-bold border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 gap-1.5 cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          Cargar 6 Métodos de Venezuela
        </Button>
      )}
      <Button
        type="button"
        onClick={onOpenCreate}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" /> Añadir Método
      </Button>
    </div>
  );
}

export function PaymentMethodsPage() {
  const { data: methods = [], isLoading } = usePaymentMethods();
  const { data: accounts = [] } = useAccounts();
  const createMethod = useCreatePaymentMethod();
  const updateMethod = useUpdatePaymentMethod();
  const deleteMethod = useDeletePaymentMethod();
  const seedVeMethods = useSeedVenezuelanPaymentMethods();

  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [initialCategory, setInitialCategory] = useState<VePaymentCategory>("Pago Móvil");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const configuredCategories = useMemo(() => {
    return new Set(methods.map((m) => inferCategoryFromMethod(m.name, m.category)));
  }, [methods]);

  const missingPresetsCount = useMemo(() => {
    return VE_PAYMENT_PRESETS.filter((p) => !configuredCategories.has(p.category)).length;
  }, [configuredCategories]);

  const openForCreate = (presetCategory?: VePaymentCategory) => {
    setEditing(null);
    setInitialCategory(presetCategory || "Pago Móvil");
    setFormOpen(true);
  };

  const openForEdit = (m: PaymentMethod) => {
    setEditing(m);
    setFormOpen(true);
  };

  const filtered = useMemo(() => {
    return methods.filter((m) => {
      const normCat = inferCategoryFromMethod(m.name, m.category);
      if (categoryFilter !== "all" && normCat !== categoryFilter) return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (!q) return true;
      const term = q.toLowerCase();
      const d = m.details || {};
      return (
        m.name.toLowerCase().includes(term) ||
        normCat.toLowerCase().includes(term) ||
        (d.bank || "").toLowerCase().includes(term) ||
        (d.phone || "").toLowerCase().includes(term) ||
        (d.documentId || "").toLowerCase().includes(term) ||
        (d.binanceId || "").toLowerCase().includes(term)
      );
    });
  }, [methods, q, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este método de pago?")) {
      try {
        await deleteMethod.mutateAsync(id);
        toast.success("Método de pago eliminado");
      } catch {
        toast.error("Error al eliminar el método");
      }
    }
  };

  const handleCopyMethodData = (m: PaymentMethod) => {
    const text = formatPaymentMethodCopyText(m);
    navigator.clipboard.writeText(text);
    setCopiedId(m.id);
    toast.success(`Datos de ${m.name} copiados al portapapeles`);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleSeedVenezuelanMethods = async () => {
    try {
      const created = await seedVeMethods.mutateAsync(methods);
      if (created.length === 0) {
        toast.info("Todos los métodos principales de Venezuela ya están registrados");
      } else {
        toast.success(
          `Se añadieron ${created.length} métodos de pago oficiales de Venezuela`
        );
      }
    } catch {
      toast.error("No se pudieron cargar las plantillas de pago");
    }
  };

  const handleSaveMethod = async (payload: {
    name: string;
    category: VePaymentCategory;
    accountId: string;
    status: "Active" | "Inactive";
    details: PaymentMethodDetails;
  }) => {
    if (!payload.name.trim()) {
      toast.error("Ingresa un nombre para el método de pago");
      return;
    }

    const encodedCategory = encodeCategoryWithDetails(payload.category, payload.details);
    const methodData = {
      name: payload.name.trim(),
      category: encodedCategory,
      account_id: payload.accountId || undefined,
      status: payload.status,
    };

    try {
      if (editing) {
        await updateMethod.mutateAsync({ ...methodData, id: editing.id });
        toast.success("Método de pago actualizado correctamente");
      } else {
        await createMethod.mutateAsync(methodData);
        toast.success("Método de pago registrado correctamente");
      }
      setFormOpen(false);
    } catch {
      toast.error("Error al guardar el método de pago");
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
        title="Métodos de Pago (Venezuela)"
        subtitle="Configura Pago Móvil, Transferencias, Binance USDT, Divisas, Efectivo Bs. y Cashea"
      >
        <div className="flex-1 max-w-md mx-auto w-full sm:w-auto">
          <div className="flex items-center gap-2 rounded-full bg-muted border border-border px-4 py-2.5 w-full">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por método, banco, teléfono, RIF o Binance..."
              aria-label="Buscar métodos de pago"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
            {q && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setQ("")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <PaymentMethodsHeaderActions
          missingPresetsCount={missingPresetsCount}
          isPending={seedVeMethods.isPending}
          onSeed={handleSeedVenezuelanMethods}
          onOpenCreate={() => openForCreate()}
        />
      </FinancePageHeader>

      <PaymentMethodsPresetCards
        methods={methods}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        setCurrentPage={setCurrentPage}
        onOpenCreate={openForCreate}
      />

      <PaymentMethodsSecondaryToolbar
        totalMethods={filtered.length}
        categoryFilter={categoryFilter}
        setCategoryFilter={(val) => {
          setCategoryFilter(val);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        setStatusFilter={(val) => {
          setStatusFilter(val);
          setCurrentPage(1);
        }}
        setCurrentPage={setCurrentPage}
      />

      <div className="flex-1 w-full min-w-0 overflow-x-auto border border-border rounded-2xl bg-card shadow-xs">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-muted/70 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
              <th className="p-4">Método de Pago</th>
              <th className="p-4">Categoría / Tasa</th>
              <th className="p-4">Datos Receptores de Cobro</th>
              <th className="p-4">Cuenta Vinculada</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-12 text-center text-muted-foreground font-medium space-y-3"
                >
                  <p className="text-base font-bold text-foreground">
                    No se encontraron métodos de pago
                  </p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    {categoryFilter !== "all" || statusFilter !== "all" || q
                      ? "Intenta ajustar los filtros de búsqueda o categoría."
                      : "Añade manualmente tus métodos de cobro o carga los 6 métodos oficiales de Venezuela."}
                  </p>
                </td>
              </tr>
            ) : (
              paginated.map((m) => (
                <PaymentMethodsTableRow
                  key={m.id}
                  method={m}
                  accounts={accounts}
                  copiedId={copiedId}
                  onCopy={() => handleCopyMethodData(m)}
                  onEdit={() => openForEdit(m)}
                  onDelete={() => handleDelete(m.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        entityLabel="métodos"
        onPageChange={setCurrentPage}
      />

      <PaymentMethodFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        accounts={accounts}
        initialCategory={initialCategory}
        isPending={createMethod.isPending || updateMethod.isPending}
        onSave={handleSaveMethod}
      />
    </div>
  );
}

export default PaymentMethodsPage;
