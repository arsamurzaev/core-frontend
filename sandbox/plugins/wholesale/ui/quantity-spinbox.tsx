"use client";

import { useCart } from "@/core/modules/cart/model/cart-context";
import { useCartProductControls } from "@/core/modules/cart/ui/use-cart-product-controls";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import React from "react";

interface QuantitySpinboxProps {
  productId: string;
  className?: string;
}

export const QuantitySpinbox: React.FC<QuantitySpinboxProps> = ({
  productId,
  className,
}) => {
  const { handleDecrement, handleIncrement, isBusy, quantity } =
    useCartProductControls(productId);
  const { setProductQuantity } = useCart();

  const [inputValue, setInputValue] = React.useState(String(quantity));

  React.useEffect(() => {
    setInputValue(String(quantity));
  }, [quantity]);

  const handleStopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 3);
    setInputValue(raw);
  };

  const handleBlur = () => {
    const parsed = parseInt(inputValue, 10);

    if (!parsed || parsed < 1) {
      setInputValue(String(quantity));
      return;
    }

    const clamped = Math.min(parsed, 999);

    if (clamped !== quantity) {
      void setProductQuantity(productId, clamped);
    }

    setInputValue(String(clamped));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return (
    <div
      onClick={handleStopPropagation}
      onPointerDown={handleStopPropagation}
      className={cn(
        "bg-secondary flex cursor-default items-center justify-center rounded-full",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={isBusy}
        aria-label="Уменьшить количество"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void handleDecrement();
        }}
      >
        −
      </Button>

      <input
        type="text"
        inputMode="numeric"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={isBusy}
        className="w-[2.75rem] bg-transparent text-center text-sm font-medium outline-none"
        aria-label="Количество товара"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={isBusy}
        aria-label="Увеличить количество"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void handleIncrement();
        }}
      >
        +
      </Button>
    </div>
  );
};
