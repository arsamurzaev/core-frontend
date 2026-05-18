"use client";

import { CartQuantityControl } from "@/core/modules/cart/ui/cart-quantity-control";
import {
  formatCatalogPrice,
  type CatalogPriceFormatMode,
} from "@/shared/lib/price-format";
import { cn } from "@/shared/lib/utils";
import { Minus, Plus } from "lucide-react";
import React from "react";

interface CartProductCardFooterQuantityProps {
  className?: string;
  controls: {
    handleDecrement: () => Promise<void>;
    handleIncrement: () => Promise<void>;
    isBusy: boolean;
    isIncrementDisabled: boolean;
  };
  currency: string;
  displayTotal: number | null;
  isDetailed: boolean;
  onClick: (event: React.SyntheticEvent) => void;
  priceFormatMode: CatalogPriceFormatMode;
}

export function CartProductCardFooterQuantity({
  className,
  controls,
  currency,
  displayTotal,
  isDetailed,
  onClick,
  priceFormatMode,
}: CartProductCardFooterQuantityProps) {
  return (
    <CartQuantityControl
      buttonClassName={cn(
        "flex items-center justify-center",
        isDetailed ? "h-4 w-4 shrink-0" : "flex-1",
      )}
      className={cn(
        "bg-secondary mt-1 cursor-default items-center justify-between gap-2.5 rounded-lg px-2.5 py-2",
        isDetailed
          ? "ml-auto inline-flex w-fit max-w-full shrink-0"
          : "flex w-full",
        controls.isBusy && "animate-pulse",
        className,
      )}
      decrementContent={<Minus size={12} />}
      decrementDisabled={controls.isBusy}
      incrementContent={<Plus size={12} />}
      incrementDisabled={controls.isBusy || controls.isIncrementDisabled}
      onClick={onClick}
      onDecrement={controls.handleDecrement}
      onIncrement={controls.handleIncrement}
      value={
        displayTotal === null ? (
          "?"
        ) : (
          <>
            {formatCatalogPrice(displayTotal, priceFormatMode)}{" "}
            <span className="font-normal">{currency}</span>
          </>
        )
      }
      valueClassName="shrink-0 text-base leading-none font-bold whitespace-nowrap"
    />
  );
}
