import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  X,
  ChevronLeft,
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
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TableRowActions } from "@/components/ui/table-row-actions";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  useSeedVenezuelanPaymentMethods,
  VE_PAYMENT_PRESETS,
  VENEZUELAN_BANKS,
  inferCategoryFromMethod,
  getDefaultDetailsForCategory,
  formatPaymentMethodCopyText,
  type PaymentMethod,
  type PaymentMethodDetails,
  type VePaymentCategory,
} from "@/lib/api/paymentMethods";
import { useAccounts } from "@/lib/api/accounts";
import { RATE_LABELS, type RateType } from "@/hooks/useExchangeRate";
import { toast } from "sonner";

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
  return (
    preset?.badgeColor ||
    "bg-primary/10 text-primary border-primary/20"
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form controlled states
  const [name, setName] = useState("");
  const [category, setCategory] = useState<VePaymentCategory>("Pago Móvil");
  const [accountId, setAccountId] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [details, setDetails] = useState<PaymentMethodDetails>({
    currency: "VES",
    defaultRateType: "bcv",
    requiresReference: true,
  });

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
    const targetCat = presetCategory || "Pago Móvil";
    const preset = VE_PAYMENT_PRESETS.find((p) => p.category === targetCat);
    setName(preset ? preset.name : "");
    setCategory(targetCat);
    setAccountId("");
    setStatus("Active");
    setDetails(
      preset
        ? { ...preset.details }
        : getDefaultDetailsForCategory(targetCat)
    );
    setFormOpen(true);
  };

  const openForEdit = (m: PaymentMethod) => {
    setEditing(m);
    const normCat = inferCategoryFromMethod(m.name, m.category);
    setName(m.name);
    setCategory(normCat);
    setAccountId(m.account_id || "");
    setStatus(m.status);
    setDetails({
      ...getDefaultDetailsForCategory(normCat, m.name),
      ...(m.details || {}),
    });
    setFormOpen(true);
  };

  const handleCategoryChange = (newCat: VePaymentCategory) => {
    setCategory(newCat);
    const preset = VE_PAYMENT_PRESETS.find((p) => p.category === newCat);
    if (!editing && preset) {
      setName(preset.name);
    }
    setDetails((prev) => ({
      ...getDefaultDetailsForCategory(newCat, name),
      bank: prev.bank,
      documentId: prev.documentId,
      holderName: prev.holderName,
      ...(preset?.details || {}),
    }));
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

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (createMethod.isPending || updateMethod.isPending) return;
    if (!name.trim()) {
      toast.error("Ingresa un nombre para el método de pago");
      return;
    }

    const methodData: Omit<PaymentMethod, "id"> = {
      name: name.trim(),
      category,
      account_id: accountId || undefined,
      status,
      details,
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
    <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-xs min-h-[calc(100vh-8rem)] font-sans flex flex-col">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="Volver"
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Métodos de Pago (Venezuela)
            </h1>
            <p className="text-xs text-muted-foreground">
              Configura Pago Móvil, Transferencias, Binance USDT, Divisas, Efectivo Bs. y Cashea
            </p>
          </div>
        </div>

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

        <div className="flex items-center gap-2.5">
          {missingPresetsCount > 0 && (
            <Button
              type="button"
              variant="outline"
              disabled={seedVeMethods.isPending}
              onClick={handleSeedVenezuelanMethods}
              className="rounded-xl text-xs font-bold border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 gap-1.5 cursor-pointer"
            >
              {seedVeMethods.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Cargar 6 Métodos de Venezuela
            </Button>
          )}
          <Button
            type="button"
            onClick={() => openForCreate()}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Añadir Método
          </Button>
        </div>
      </header>

      {/* TARJETAS RÁPIDAS DEL ECOSISTEMA VENEZOLANO */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5">
        {VE_PAYMENT_PRESETS.map((preset) => {
          const Icon = getCategoryIcon(preset.category);
          const existing = methods.find(
            (m) => inferCategoryFromMethod(m.name, m.category) === preset.category
          );
          const isFilterSelected = categoryFilter === preset.category;

          return (
            <div
              key={preset.category}
              onClick={() => {
                if (existing) {
                  setCategoryFilter((prev) =>
                    prev === preset.category ? "all" : preset.category
                  );
                  setCurrentPage(1);
                } else {
                  openForCreate(preset.category);
                }
              }}
              className={cn(
                "rounded-2xl border p-3 transition-all cursor-pointer flex flex-col justify-between gap-2",
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
                  {preset.details.currency === "VES"
                    ? "Bolívares (Tasa BCV)"
                    : preset.details.currency === "USDT"
                    ? "Cripto USDT (Binance)"
                    : preset.category === "Cashea"
                    ? `Inicial ${preset.details.casheaDefaultInitialPct}% + Cuotas`
                    : "Dólares ($) / Euros (€)"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* BARRA DE FILTROS SECUNDARIA */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-border pb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <CreditCard className="h-4 w-4 text-primary" /> {filtered.length} métodos registrados
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
          <div className="flex items-center gap-1.5 text-xs">
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

      {/* TABLA DE MÉTODOS DE PAGO */}
      <div className="flex-1 overflow-x-auto border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
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
                  <p>No se encontraron métodos de pago configurados.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSeedVenezuelanMethods}
                    className="rounded-xl text-xs font-bold border-primary/30 text-primary cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Cargar Efectivo, Pago Móvil, Transferencia, Binance, Divisas y Cashea
                  </Button>
                </td>
              </tr>
            ) : (
              paginated.map((m) => {
                const normCat = inferCategoryFromMethod(m.name, m.category);
                const Icon = getCategoryIcon(normCat);
                const d = m.details || getDefaultDetailsForCategory(normCat, m.name);
                const rateType: RateType = d.defaultRateType || "bcv";
                const linkedAccount = accounts.find((a) => a.id === m.account_id);

                return (
                  <tr
                    key={m.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-9 w-9 rounded-xl border flex items-center justify-center shrink-0",
                            getCategoryBadgeStyle(normCat)
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{m.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {d.requiresReference
                              ? "Requiere N° de referencia / comprobante"
                              : "Recepción directa en caja"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2.5 py-0.5 rounded-full border w-fit",
                            getCategoryBadgeStyle(normCat)
                          )}
                        >
                          {normCat}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          Moneda: {d.currency || "VES"} · {RATE_LABELS[rateType].short}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center justify-between gap-2 max-w-[290px]">
                        <div className="text-xs text-muted-foreground space-y-0.5 truncate">
                          {normCat === "Pago Móvil" && (
                            <>
                              <p className="font-semibold text-foreground truncate">
                                {d.bank || "Banco no especificado"}
                              </p>
                              <p className="truncate">
                                {d.phone ? `Tel: ${d.phone}` : "Sin teléfono"}{" "}
                                {d.documentId ? `· ${d.documentId}` : ""}
                              </p>
                            </>
                          )}
                          {normCat === "Transferencia" && (
                            <>
                              <p className="font-semibold text-foreground truncate">
                                {d.bank || "Banco no especificado"}
                              </p>
                              <p className="truncate">
                                {d.accountNumber
                                  ? `Cta: ${d.accountNumber}`
                                  : "Sin N° de cuenta"}{" "}
                                {d.documentId ? `· ${d.documentId}` : ""}
                              </p>
                            </>
                          )}
                          {normCat === "Binance" && (
                            <>
                              <p className="font-semibold text-foreground truncate">
                                {d.binanceId || "Configurar Correo / UID Binance"}
                              </p>
                              <p className="truncate">
                                {d.holderName ? `Titular: ${d.holderName}` : "Binance Pay (USDT)"}
                              </p>
                            </>
                          )}
                          {normCat === "Cashea" && (
                            <>
                              <p className="font-semibold text-foreground">
                                Inicial base: {d.casheaDefaultInitialPct || 50}% en tienda
                              </p>
                              <p className="truncate">+ 3 cuotas sin interés cada 14 días</p>
                            </>
                          )}
                          {(normCat === "Divisas" ||
                            normCat === "Efectivo" ||
                            normCat === "Punto de Venta") && (
                            <p className="truncate">
                              {d.instructions ||
                                (normCat === "Divisas"
                                  ? "Recepción de billetes USD ($) y EUR (€)"
                                  : "Recepción directa en taquilla")}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyMethodData(m)}
                          title="Copiar datos de cobro para enviar al paciente"
                          className="p-1.5 rounded-lg bg-muted hover:bg-primary/15 text-muted-foreground hover:text-primary transition cursor-pointer shrink-0"
                        >
                          {copiedId === m.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="p-4 text-muted-foreground font-medium text-xs">
                      {linkedAccount ? (
                        <span className="font-semibold text-foreground">
                          {linkedAccount.name}{" "}
                          <span className="text-emerald-600 dark:text-emerald-400">
                            (${linkedAccount.balance.toFixed(2)})
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/70 italic">
                          Caja General (Sin vincular)
                        </span>
                      )}
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
                      onEdit={() => openForEdit(m)}
                      onDelete={() => handleDelete(m.id)}
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
        entityLabel="métodos"
        onPageChange={setCurrentPage}
      />

      {/* DIÁLOGO PROFESIONAL DE CONFIGURACIÓN DE MÉTODO DE PAGO */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[540px] rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editing ? `Editar ${editing.name}` : "Configurar Método de Pago"}
            </DialogTitle>
            <DialogDescription>
              Define la categoría, tasa referencial y los datos receptores que verá recepción al cobrar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            {/* PLANTILLA DE CATEGORÍA */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tipo de Método en Venezuela
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {VE_PAYMENT_PRESETS.map((p) => {
                  const Icon = getCategoryIcon(p.category);
                  const active = category === p.category;
                  return (
                    <button
                      key={p.category}
                      type="button"
                      onClick={() => handleCategoryChange(p.category)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-[11px] font-bold transition cursor-pointer",
                        active
                          ? "border-primary bg-primary/10 text-primary shadow-2xs"
                          : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="truncate max-w-full">{p.category}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pm-name" className="text-xs font-bold text-foreground">
                  Nombre del Método *
                </Label>
                <Input
                  id="pm-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Pago Móvil Banesco"
                  required
                  className="rounded-xl bg-muted/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pm-account" className="text-xs font-bold text-foreground">
                  Cuenta Financiera Destino
                </Label>
                <select
                  id="pm-account"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full h-10 px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm outline-none"
                >
                  <option value="">-- Caja General (Sin cuenta específica) --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (${acc.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pm-currency" className="text-xs font-bold text-foreground">
                  Moneda Base
                </Label>
                <select
                  id="pm-currency"
                  value={details.currency || "VES"}
                  onChange={(e) =>
                    setDetails((prev) => ({
                      ...prev,
                      currency: e.target.value as PaymentMethodDetails["currency"],
                    }))
                  }
                  className="w-full h-10 px-3 rounded-xl bg-muted/50 border border-border text-xs font-bold outline-none"
                >
                  <option value="VES">Bolívares (Bs.)</option>
                  <option value="USD">Dólares ($ USD)</option>
                  <option value="USDT">USDT (Binance)</option>
                  <option value="EUR">Euros (€ EUR)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pm-rate" className="text-xs font-bold text-foreground">
                  Tasa Sugerida
                </Label>
                <select
                  id="pm-rate"
                  value={details.defaultRateType || "bcv"}
                  onChange={(e) =>
                    setDetails((prev) => ({
                      ...prev,
                      defaultRateType: e.target.value as RateType,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-xl bg-muted/50 border border-border text-xs font-bold outline-none"
                >
                  <option value="bcv">Dólar BCV ($)</option>
                  <option value="eur">Euro BCV (€)</option>
                  <option value="usdt">USDT (Binance P2P)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pm-status" className="text-xs font-bold text-foreground">
                  Estado
                </Label>
                <select
                  id="pm-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
                  className="w-full h-10 px-3 rounded-xl bg-muted/50 border border-border text-xs font-bold outline-none"
                >
                  <option value="Active">Activo</option>
                  <option value="Inactive">Inactivo</option>
                </select>
              </div>
            </div>

            {/* CAMPOS ESPECÍFICOS SEGÚN CATEGORÍA VENEZOLANA */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  Datos Receptores ({category})
                </span>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={details.requiresReference ?? true}
                    onChange={(e) =>
                      setDetails((prev) => ({
                        ...prev,
                        requiresReference: e.target.checked,
                      }))
                    }
                    className="rounded accent-primary"
                  />
                  Solicitar N° de Referencia al cobrar
                </label>
              </div>

              {category === "Pago Móvil" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] font-bold">Banco Receptor (Venezuela)</Label>
                    <select
                      aria-label="Banco Receptor"
                      value={details.bank || ""}
                      onChange={(e) =>
                        setDetails((prev) => ({ ...prev, bank: e.target.value }))
                      }
                      className="w-full h-9 px-3 rounded-xl bg-background border border-border text-xs font-semibold outline-none"
                    >
                      <option value="">-- Seleccionar Banco --</option>
                      {VENEZUELAN_BANKS.map((b) => (
                        <option key={b.code} value={`${b.code} - ${b.name}`}>
                          {b.code} — {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px] font-bold">Teléfono Afiliado</Label>
                    <Input
                      placeholder="Ej. 0414-1234567"
                      value={details.phone || ""}
                      onChange={(e) =>
                        setDetails((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="rounded-xl h-9 text-xs bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">RIF o Cédula</Label>
                    <Input
                      placeholder="Ej. J-12345678-9"
                      value={details.documentId || ""}
                      onChange={(e) =>
                        setDetails((prev) => ({ ...prev, documentId: e.target.value }))
                      }
                      className="rounded-xl h-9 text-xs bg-background"
                    />
                  </div>
                </div>
              )}

              {category === "Transferencia" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">Banco</Label>
                    <select
                      aria-label="Banco de Transferencia"
                      value={details.bank || ""}
                      onChange={(e) =>
                        setDetails((prev) => ({ ...prev, bank: e.target.value }))
                      }
                      className="w-full h-9 px-3 rounded-xl bg-background border border-border text-xs font-semibold outline-none"
                    >
                      <option value="">-- Seleccionar Banco --</option>
                      {VENEZUELAN_BANKS.map((b) => (
                        <option key={b.code} value={`${b.code} - ${b.name}`}>
                          {b.code} — {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">RIF o Cédula</Label>
                    <Input
                      placeholder="Ej. J-12345678-9"
                      value={details.documentId || ""}
                      onChange={(e) =>
                        setDetails((prev) => ({ ...prev, documentId: e.target.value }))
                      }
                      className="rounded-xl h-9 text-xs bg-background"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px] font-bold">
                      Número de Cuenta (20 dígitos)
                    </Label>
                    <Input
                      placeholder="0134-0000-00-0000000000"
                      maxLength={24}
                      value={details.accountNumber || ""}
                      onChange={(e) =>
                        setDetails((prev) => ({
                          ...prev,
                          accountNumber: e.target.value,
                        }))
                      }
                      className="rounded-xl h-9 text-xs font-mono bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">Titular / Razón Social</Label>
                    <Input
                      placeholder="Ej. Clínica Medizen C.A."
                      value={details.holderName || ""}
                      onChange={(e) =>
                        setDetails((prev) => ({ ...prev, holderName: e.target.value }))
                      }
                      className="rounded-xl h-9 text-xs bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">Tipo de Cuenta</Label>
                    <select
                      aria-label="Tipo de Cuenta"
                      value={details.accountType || "Corriente"}
                      onChange={(e) =>
                        setDetails((prev) => ({
                          ...prev,
                          accountType: e.target.value as "Corriente" | "Ahorro",
                        }))
                      }
                      className="w-full h-9 px-3 rounded-xl bg-background border border-border text-xs font-semibold outline-none"
                    >
                      <option value="Corriente">Cuenta Corriente</option>
                      <option value="Ahorro">Cuenta de Ahorro</option>
                    </select>
                  </div>
                </div>
              )}

              {category === "Binance" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">
                      Correo Binance o Binance ID (Pay ID)
                    </Label>
                    <Input
                      placeholder="Ej. pagos@clinica.com o ID 283948192"
                      value={details.binanceId || ""}
                      onChange={(e) =>
                        setDetails((prev) => ({ ...prev, binanceId: e.target.value }))
                      }
                      className="rounded-xl h-9 text-xs bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">Alias / Usuario Receptor</Label>
                    <Input
                      placeholder="Ej. Medizen_Oficial"
                      value={details.holderName || ""}
                      onChange={(e) =>
                        setDetails((prev) => ({ ...prev, holderName: e.target.value }))
                      }
                      className="rounded-xl h-9 text-xs bg-background"
                    />
                  </div>
                </div>
              )}

              {category === "Cashea" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">
                      % de Inicial Predeterminado
                    </Label>
                    <select
                      aria-label="Porcentaje de inicial Cashea"
                      value={details.casheaDefaultInitialPct || 50}
                      onChange={(e) =>
                        setDetails((prev) => ({
                          ...prev,
                          casheaDefaultInitialPct: Number(e.target.value),
                        }))
                      }
                      className="w-full h-9 px-3 rounded-xl bg-background border border-border text-xs font-semibold outline-none"
                    >
                      <option value={60}>Nivel 1 — 60% Inicial + 3 cuotas</option>
                      <option value={50}>Nivel 2 — 50% Inicial + 3 cuotas</option>
                      <option value={40}>Nivel 3+ — 40% Inicial + 3 cuotas</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold">Nombre de Aliado / Caja</Label>
                    <Input
                      placeholder="Ej. Aliado Cashea Medizen"
                      value={details.holderName || ""}
                      onChange={(e) =>
                        setDetails((prev) => ({ ...prev, holderName: e.target.value }))
                      }
                      className="rounded-xl h-9 text-xs bg-background"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-[11px] font-bold">
                  Instrucciones o Notas de Caja
                </Label>
                <Input
                  placeholder="Ej. Verificar seriales de billetes o últimos 4 dígitos..."
                  value={details.instructions || ""}
                  onChange={(e) =>
                    setDetails((prev) => ({ ...prev, instructions: e.target.value }))
                  }
                  className="rounded-xl h-9 text-xs bg-background"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMethod.isPending || updateMethod.isPending}
                className="rounded-xl bg-primary text-primary-foreground cursor-pointer"
              >
                {(createMethod.isPending || updateMethod.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {editing ? "Guardar Cambios" : "Guardar Método"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
