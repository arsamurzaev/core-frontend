import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import React from "react";

interface Props {
  className?: string;
}

export const PopularProductCarouselSkeleton: React.FC<Props> = ({
  className,
}) => {
  return (
    <div className={cn("space-y-8", className)}>
      <Skeleton className="h-8" />
      <div className="space-y-3">
        <Skeleton className="h-55" />
        <div className="flex justify-center gap-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              className={cn(index === 0 && "w-24", "h-1 rounded-full w-2")}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
