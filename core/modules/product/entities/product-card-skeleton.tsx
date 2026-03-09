import { cn } from "@/shared/lib/utils";
import { AspectRatio } from "@/shared/ui/aspect-ratio";
import { Skeleton } from "@/shared/ui/skeleton";
import React from "react";

interface Props {
  className?: string;
  isDetailed?: boolean;
}

export const ProductCardSkeleton: React.FC<Props> = ({
  className,
  isDetailed = false,
}) => {
  return (
    <article
      className={cn(
        "bg-card shadow-custom relative flex h-full flex-col gap-2 overflow-hidden rounded-lg",
        isDetailed && "min-h-[160px] flex-row",
        className,
      )}
      aria-hidden
    >
      <div className="min-w-25 flex-[0_1_160px]">
        <AspectRatio ratio={3 / 4}>
          <Skeleton className="h-full w-full rounded-none" />
        </AspectRatio>
      </div>
      <div
        className={cn(
          "flex flex-1 flex-col justify-between p-2 pt-0",
          isDetailed && "pt-2",
        )}
      >
        <div className="space-y-2 text-left">
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-4 w-2/3" />
          {isDetailed ? <Skeleton className="h-4 w-5/6" /> : null}
          {isDetailed ? <Skeleton className="h-4 w-2/3" /> : null}
        </div>
        <div
          className={cn(
            "flex w-full flex-col items-end justify-center gap-2",
            isDetailed && "pt-4",
          )}
        >
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </article>
  );
};
