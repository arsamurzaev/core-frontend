import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import React from "react";

interface Props {
  className?: string;
}

export const CategoryCardSkeleton: React.FC<Props> = ({ className }) => {
  return (
    <article className="relative p-1" aria-hidden>
      <div
        className={cn(
          "shadow-custom relative flex aspect-2/1 w-full flex-col justify-end overflow-hidden rounded-lg bg-card/60 px-6 py-5",
          className,
        )}
      >
        <div className="absolute inset-0 bg-linear-to-br from-muted/80 via-muted/55 to-muted/35" />
        <div className="relative space-y-3">
          <Skeleton className="h-8 w-2/3 bg-white/30 sm:h-12" />
          <Skeleton className="h-3.5 w-1/2 bg-white/20 sm:h-5" />
        </div>
      </div>
    </article>
  );
};
