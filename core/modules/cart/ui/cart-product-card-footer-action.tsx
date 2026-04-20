"use client";

import { useCartProductPricing } from "@/core/modules/cart/model/cart-context";
import { useCartProductControls } from "@/core/modules/cart/ui/use-cart-product-controls";
import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import { Minus, Plus } from "lucide-react";
import React from "react";

interface CartProductCardFooterActionProps {
  className?: string;
  isDetailed?: boolean;
  product: ProductWithAttributesDto;
}

export const CartProductCardFooterAction = React.memo(function CartProductCardFooterAction({ className, isDetailed = false, product }: CartProductCardFooterActionProps) {
  const pricing = useCartProductPricing(product);
  const { handleDecrement, handleIncrement, isBusy, quantity } =
    useCartProductControls(product.id);

  const handlePreventCardNavigation = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  if (!quantity || !pricing) {
    return null;
  }

  return (
    <div
      onClick={handlePreventCardNavigation}
      className={cn(
        "bg-secondary mt-1 cursor-default items-center justify-between gap-2.5 rounded-lg px-2.5 py-2",
        isDetailed
          ? "ml-auto inline-flex w-fit max-w-full shrink-0"
          : "flex w-full",
        isBusy && "animate-pulse",
        className,
      )}
    >
      <button
        type="button"
        disabled={isBusy}
        className={cn(
          "flex items-center justify-center",
          isDetailed ? "h-4 w-4 shrink-0" : "flex-1",
        )}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void handleDecrement();
        }}
        aria-label="Уменьшить количество"
      >
        <Minus size={12} />
      </button>
      <p className="shrink-0 whitespace-nowrap text-base leading-none font-bold">
        {Intl.NumberFormat("ru").format(pricing.displayTotal)}{" "}
        <span className="font-normal">{pricing.currency}</span>
      </p>
      <button
        type="button"
        disabled={isBusy}
        className={cn(
          "flex items-center justify-center",
          isDetailed ? "h-4 w-4 shrink-0" : "flex-1",
        )}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void handleIncrement();
        }}
        aria-label="Увеличить количество"
      >
        <Plus size={12} />
      </button>
    </div>
  );
});
