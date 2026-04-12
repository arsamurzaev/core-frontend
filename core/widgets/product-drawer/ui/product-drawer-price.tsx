"use client";

import {
  formatProductDrawerPrice,
} from "@/core/widgets/product-drawer/model/product-drawer-view";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";

interface ProductDrawerPriceProps {
  currency: string;
  discount: number;
  displayPrice: number;
  hasDiscount: boolean;
  isLoading: boolean;
  price: number;
}

export function ProductDrawerPrice({
  currency,
  discount,
  displayPrice,
  hasDiscount,
  isLoading,
  price,
}: ProductDrawerPriceProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-28" />
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {hasDiscount ? (
        <div className="text-muted text-xl line-through">
          {discount > 0 ? (
            <Badge className="absolute top-3 left-0">-{discount}%</Badge>
          ) : null}
          <span className="font-bold">{formatProductDrawerPrice(price)}</span>{" "}
          {currency}
        </div>
      ) : null}

      <div className={cn("text-xl", !Boolean(displayPrice) && "hidden")}>
        <span className="font-bold">
          {formatProductDrawerPrice(displayPrice)}
        </span>{" "}
        {currency}
      </div>
    </div>
  );
}
