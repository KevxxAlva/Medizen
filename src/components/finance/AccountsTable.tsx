import {
  Landmark,
  Banknote,
  Coins,
  Layers,
  Wallet,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TableRowActions } from "@/components/ui/table-row-actions";
import {
  normalizeAccountType,
  getAccountTypeInfo,
  type FinancialAccount as Account,
} from "@/lib/api/accounts";
import {
  getCategoryIcon,
  getCategoryBadgeStyle,
} from "@/components/finance/PaymentMethodsPage";
import { formatBs, type ExchangeRates } from "@/hooks/useExchangeRate";

export function getAccountIcon(type: string, name = "") {
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

export interface AccountsTableRowProps {
  account: Account;
  linkedMethods: Array<{ name: string; category: string; isExplicit: boolean }>;
  rates: ExchangeRates;
  onEdit: () => void;
  onDelete: () => void;
}

export function AccountsTableRow({
  account: a,
  linkedMethods,
  rates,
  onEdit,
  onDelete,
}: AccountsTableRowProps) {
  const normType = normalizeAccountType(a.type, a.name);
  const typeInfo = getAccountTypeInfo(normType, a.name);
  const Icon = getAccountIcon(normType, a.name);
  const refRate = normType === "Digital" ? rates.usdt : rates.bcv;

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition group">
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
              {a.meta?.bankName || a.meta?.notes || typeInfo.description}
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
            ${a.balance.toFixed(2)} {normType === "Digital" ? "USDT" : "USD"}
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
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </tr>
  );
}

export interface AccountsTableProps {
  paginated: Account[];
  methodsByAccount: Map<string, Array<{ name: string; category: string; isExplicit: boolean }>>;
  rates: ExchangeRates;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export function AccountsTable({
  paginated,
  methodsByAccount,
  rates,
  onEdit,
  onDelete,
}: AccountsTableProps) {
  return (
    <div className="flex-1 w-full min-w-0 overflow-x-auto border border-border rounded-2xl bg-card shadow-xs">
      <table className="w-full text-left border-collapse min-w-[760px]">
        <thead>
          <tr className="bg-muted/70 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
            {[
              { label: "Nombre de Cuenta / Bóveda", align: "left" },
              { label: "Categoría y Moneda", align: "left" },
              { label: "Métodos de Pago que Recibe", align: "left" },
              { label: "Balance ($ USD / Equiv. Bs.)", align: "left" },
              { label: "Estado", align: "left" },
              { label: "Acción", align: "right" },
            ].map((col) => (
              <th
                key={col.label}
                className={cn("p-4", col.align === "right" && "text-right")}
              >
                {col.label}
              </th>
            ))}
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
            paginated.map((a) => (
              <AccountsTableRow
                key={a.id}
                account={a}
                linkedMethods={methodsByAccount.get(a.id) || []}
                rates={rates}
                onEdit={() => onEdit(a)}
                onDelete={() => onDelete(a.id)}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AccountsTable;
