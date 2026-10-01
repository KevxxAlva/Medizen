import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-3xl border border-border/50 bg-card/70 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-2xl" />
            </div>
            <Skeleton className="h-8 w-32 rounded-lg" />
            <Skeleton className="h-3 w-40 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-3xl border border-border/50 bg-card/70 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-3 w-64 rounded-md" />
            </div>
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>

        <div className="p-6 rounded-3xl border border-border/50 bg-card/70 space-y-4 flex flex-col items-center justify-center">
          <Skeleton className="h-5 w-36 rounded-md self-start" />
          <Skeleton className="h-36 w-36 rounded-full my-4" />
          <div className="w-full space-y-2">
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-4/5 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
