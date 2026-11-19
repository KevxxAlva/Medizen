import React from "react";
import type { LucideIcon } from "lucide-react";

export interface TreasuryChannelCardProps {
  label: string;
  icon: LucideIcon;
  iconColor: string;
  primaryValue: string;
  secondaryValue: string;
}

export function TreasuryChannelCard({
  label,
  icon: Icon,
  iconColor,
  primaryValue,
  secondaryValue,
}: TreasuryChannelCardProps) {
  return (
    <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/70 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div>
        <span className="font-display text-lg font-bold text-foreground tabular-nums block truncate">
          {primaryValue}
        </span>
        <span className="text-[10px] text-muted-foreground tabular-nums block truncate">
          {secondaryValue}
        </span>
      </div>
    </div>
  );
}
