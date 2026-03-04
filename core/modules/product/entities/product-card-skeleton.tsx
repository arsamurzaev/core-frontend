import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import React from "react";

interface Props {
  className?: string;
}

export const ProductCardSkeleton: React.FC<Props> = ({ className }) => {
  return <Skeleton className={cn("rounded-lg h-90", className)} />;
};
