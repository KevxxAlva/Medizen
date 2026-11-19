import React from "react";
import { ChevronLeft } from "lucide-react";

export interface FinancePageHeaderProps {
  title: string;
  subtitle: string;
  onBack?: () => void;
  children?: React.ReactNode;
}

export function FinancePageHeader({
  title,
  subtitle,
  onBack = () => window.history.back(),
  children,
}: FinancePageHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 mb-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          className="text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </header>
  );
}
export default FinancePageHeader;
