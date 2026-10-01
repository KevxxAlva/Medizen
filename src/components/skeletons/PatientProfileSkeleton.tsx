import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function PatientProfileSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full animate-in fade-in duration-300">
      {/* Top Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-3 w-72 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-10 w-40 rounded-2xl" />
      </div>

      {/* Big Clinical Banner Skeleton */}
      <div className="rounded-[2.5rem] border border-border/50 bg-card/70 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-3xl" />
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-52 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-3.5 w-24 rounded-md" />
                <Skeleton className="h-3.5 w-28 rounded-md" />
                <Skeleton className="h-3.5 w-32 rounded-md" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-2xl">
            <Skeleton className="h-10 w-16 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Tabs navigation skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-2xl" />
        ))}
      </div>

      {/* Tab content cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 rounded-3xl border border-border/50 bg-card/60 space-y-4">
            <Skeleton className="h-4 w-32 rounded-md" />
            <div className="space-y-3">
              <Skeleton className="h-3.5 w-full rounded-md" />
              <Skeleton className="h-3.5 w-3/4 rounded-md" />
              <Skeleton className="h-3.5 w-5/6 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
