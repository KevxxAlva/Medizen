import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Loader2 } from "lucide-react";

export function PatientProfileSkeleton() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full bg-card rounded-[2.5rem] border border-border/50 shadow-sm space-y-6 animate-in fade-in duration-200">
      {/* Top Header with real title + loading badge */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-2xl bg-muted" />
          <div>
            <div className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              Expediente Clínico
              <Sparkles className="h-4 w-4 text-primary/70 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              Cargando historial médico centralizado y antecedentes...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-36 rounded-2xl bg-muted" />
          <Skeleton className="h-10 w-44 rounded-2xl bg-primary/15" />
        </div>
      </div>

      {/* Big Clinical Banner Skeleton */}
      <div className="rounded-3xl border border-border/60 bg-muted/30 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-2xl bg-primary/15" />
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-52 rounded-lg bg-muted" />
                <Skeleton className="h-5 w-20 rounded-full bg-primary/15" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-4 w-24 rounded-md bg-muted" />
                <Skeleton className="h-4 w-28 rounded-md bg-muted" />
                <Skeleton className="h-4 w-32 rounded-md bg-muted" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-card p-3 rounded-2xl border border-border/40">
            <Skeleton className="h-10 w-20 rounded-xl bg-muted" />
            <Skeleton className="h-10 w-28 rounded-xl bg-muted" />
          </div>
        </div>
      </div>

      {/* Tabs navigation skeleton */}
      <div className="flex flex-wrap gap-2 bg-muted/40 p-1.5 rounded-2xl border border-border/40">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-xl bg-card" />
        ))}
      </div>

      {/* Tab content cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 rounded-3xl border border-border/50 bg-muted/20 space-y-4">
            <Skeleton className="h-4 w-36 rounded-md bg-primary/15" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full rounded-md bg-muted" />
              <Skeleton className="h-4 w-3/4 rounded-md bg-muted" />
              <Skeleton className="h-4 w-5/6 rounded-md bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
