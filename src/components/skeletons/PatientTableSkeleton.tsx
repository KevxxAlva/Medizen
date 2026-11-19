import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function PatientTableSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Search and filters bar skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-card/60 border border-border/40">
        <Skeleton className="h-10 w-full sm:w-80 rounded-xl" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Table rows skeleton */}
      <div className="rounded-3xl border border-border/50 bg-card/70 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>

        <div className="divide-y divide-border/30">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-44 rounded-md" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-24 rounded-md" />
                    <Skeleton className="h-3 w-16 rounded-md" />
                  </div>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-6">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>

              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-20 rounded-xl" />
                <Skeleton className="h-9 w-9 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
