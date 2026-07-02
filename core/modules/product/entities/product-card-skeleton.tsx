import { cn } from "@/shared/lib/utils";
import { AspectRatio } from "@/shared/ui/aspect-ratio";
import { Skeleton } from "@/shared/ui/skeleton";
import React from "react";
import { PRODUCT_CARD_GRID_BASE_HEIGHT_PX } from "../model/product-card-layout";

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
        "relative flex h-full flex-col gap-2 overflow-hidden rounded-panel bg-surface-raised shadow-surface",
        isDetailed && "min-h-[160px] flex-row",
        className,
      )}
      style={
        isDetailed ? undefined : { minHeight: PRODUCT_CARD_GRID_BASE_HEIGHT_PX }
      }
      aria-hidden
    >
      <div className="relative min-w-25 flex-[0_1_160px]">
        <AspectRatio ratio={3 / 4}>
          <Skeleton className="h-full w-full rounded-none" />
          <Skeleton
            className={cn(
              "absolute top-2 right-2 rounded-control shadow-control",
              isDetailed ? "size-9" : "size-10",
            )}
          />
        </AspectRatio>
      </div>
      <div
        className={cn(
          "flex flex-1 flex-col justify-between gap-4 p-2 pt-0",
          isDetailed && "pt-2",
        )}
      >
        <div className="space-y-2 text-left">
          <Skeleton className="h-5 w-11/12 rounded-control" />
          <Skeleton className="h-5 w-2/3 rounded-control" />
          <Skeleton className="h-4 w-3/4 rounded-control" />
          {isDetailed ? (
            <Skeleton className="h-4 w-5/6 rounded-control" />
          ) : null}
          {isDetailed ? (
            <Skeleton className="h-4 w-2/3 rounded-control" />
          ) : null}
        </div>
        <div
          className={cn(
            "mt-auto flex w-full items-end gap-2",
            isDetailed ? "justify-between pt-4" : "justify-between",
          )}
        >
          <Skeleton className="size-6 rounded-control" />
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-3 w-16 rounded-control" />
            <Skeleton className="h-6 w-24 rounded-control" />
          </div>
        </div>
      </div>
    </article>
  );
};
