import { Skeleton } from "@/shared/ui/skeleton";
import React from "react";

export const ProductDrawerLoading: React.FC = () => {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" />

      <div className="bg-background fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-lg border-t pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-center pt-3">
          <div className="bg-muted h-1.5 w-12 rounded-full" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="relative overflow-hidden rounded-t-xl">
            <Skeleton className="h-[38dvh] min-h-[240px] w-full rounded-none" />
            <Skeleton className="absolute top-4 right-4 size-9 rounded-md" />
          </div>

          <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
            <div className="space-y-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-4 w-28" />
            </div>
          </div>

          <div className="mt-auto border-t p-4 pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-7 w-28" />
            </div>

            <Skeleton className="mt-4 h-10 w-full" />
          </div>
        </div>
      </div>
    </>
  );
};
