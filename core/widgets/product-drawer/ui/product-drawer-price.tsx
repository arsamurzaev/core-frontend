"use client";

import {
  formatProductDrawerPrice,
} from "@/core/widgets/product-drawer/model/product-drawer-view";
import type { CatalogPriceFormatMode } from "@/shared/lib/price-format";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";

interface ProductDrawerPriceProps {
  currency: string;
  discount: number;
  displayPrice: number | null;
  hasDiscount: boolean;
  isLoading: boolean;
  price: number | null;
  priceFormatMode: CatalogPriceFormatMode;
}

export function ProductDrawerPrice({
  currency,
  discount,
  displayPrice,
  hasDiscount,
  isLoading,
  price,
  priceFormatMode,
}: ProductDrawerPriceProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-28" />
      </div>
    );
  }

  const hasDisplayPrice =
    typeof displayPrice === "number" && Number.isFinite(displayPrice);
  const hasOriginalPrice = typeof price === "number" && Number.isFinite(price);

  return (
    <div className="flex gap-4">
      {hasDiscount && hasOriginalPrice ? (
        <div className="text-muted text-xl line-through">
          {discount > 0 ? (
            <Badge className="absolute top-3 left-0">-{discount}%</Badge>
          ) : null}
          <span className="font-bold">
            {formatProductDrawerPrice(price, priceFormatMode)}
          </span>{" "}
          {currency}
        </div>
      ) : null}

      {hasDisplayPrice ? (
        <div className="text-xl">
          <span className="font-bold">
            {formatProductDrawerPrice(displayPrice, priceFormatMode)}
          </span>{" "}
          {currency}
        </div>
      ) : null}
    </div>
  );
}
