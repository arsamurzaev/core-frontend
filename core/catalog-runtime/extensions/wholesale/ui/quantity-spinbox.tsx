"use client";

import { useCart } from "@/core/modules/cart/model/cart-context";
import { useCartProductControls } from "@/core/modules/cart/ui/use-cart-product-controls";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { confirm } from "@/shared/ui/confirmation";
import React from "react";

interface QuantitySpinboxProps {
  className?: string;
  maxQuantity?: number;
  productId: string;
  quantityScope?: "line" | "product";
  saleUnitId?: string | null;
  variantId?: string | null;
}

export const QuantitySpinbox: React.FC<QuantitySpinboxProps> = ({
  className,
  maxQuantity,
  productId,
  quantityScope,
  saleUnitId,
  variantId,
}) => {
  const {
    handleDecrement,
    handleIncrement,
    isBusy,
    isIncrementDisabled,
    selection,
    quantity,
  } = useCartProductControls(
    {
      productId,
      saleUnitId,
      variantId,
    },
    undefined,
    {
      maxQuantity,
      quantityScope,
    },
  );
  const { setLineQuantity } = useCart();
  const [inputValue, setInputValue] = React.useState(String(quantity));
  const rootRef = React.useRef<HTMLDivElement>(null);
  const suppressCardClickUntilRef = React.useRef(0);
  const suppressDocumentClickUntilRef = React.useRef(0);

  React.useEffect(() => {
    setInputValue(String(quantity));
  }, [quantity]);

  React.useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (Date.now() > suppressDocumentClickUntilRef.current) {
        return;
      }

      const target = event.target;
      const root = rootRef.current;

      if (!(target instanceof Node) || root?.contains(target)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
    };

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, []);

  const suppressNextCardClick = React.useCallback(() => {
    suppressCardClickUntilRef.current = Date.now() + 700;
  }, []);

  const suppressNextDocumentClick = React.useCallback(() => {
    suppressDocumentClickUntilRef.current = Date.now() + 700;
  }, []);

  const handleInteractiveEvent = React.useCallback(
    (event: React.SyntheticEvent) => {
      suppressNextCardClick();
      event.stopPropagation();
    },
    [suppressNextCardClick],
  );

  const handleGuardedClick = React.useCallback(
    (event: React.SyntheticEvent) => {
      if (Date.now() <= suppressCardClickUntilRef.current) {
        event.preventDefault();
      }

      event.stopPropagation();
    },
    [],
  );

  const selectInputValue = React.useCallback((input: HTMLInputElement) => {
    window.requestAnimationFrame(() => {
      input.select();
    });
  }, []);

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    suppressNextCardClick();
    event.stopPropagation();
    selectInputValue(event.currentTarget);
  };

  const handleInputClick = (event: React.MouseEvent<HTMLInputElement>) => {
    handleGuardedClick(event);
    selectInputValue(event.currentTarget);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    suppressNextCardClick();
    const raw = event.target.value.replace(/\D/g, "").slice(0, 3);
    setInputValue(raw);
  };

  const handleBlur = async () => {
    suppressNextCardClick();
    suppressNextDocumentClick();
    const parsed = parseInt(inputValue, 10);

    if (!parsed || parsed < 1) {
      const isConfirmed = await confirm({
        title: "Удалить товар из корзины?",
        description: "Товар будет удален из текущей корзины.",
        confirmText: "Удалить",
        cancelText: "Отмена",
      });

      if (!isConfirmed) {
        setInputValue(String(quantity));
        return;
      }

      if (quantity > 0) {
        void setLineQuantity(selection, 0);
      }

      setInputValue("0");
      return;
    }

    const maxInputQuantity =
      maxQuantity === undefined ? 999 : Math.max(0, Math.min(maxQuantity, 999));
    const clamped = Math.min(parsed, maxInputQuantity);

    if (clamped !== quantity) {
      void setLineQuantity(selection, clamped);
    }

    setInputValue(String(clamped));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    suppressNextCardClick();
    event.stopPropagation();

    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  };

  return (
    <div
      ref={rootRef}
      onClick={handleGuardedClick}
      onMouseDown={handleInteractiveEvent}
      onMouseUp={handleInteractiveEvent}
      onPointerDown={handleInteractiveEvent}
      onPointerUp={handleInteractiveEvent}
      onTouchEnd={handleInteractiveEvent}
      onTouchStart={handleInteractiveEvent}
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
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          suppressNextCardClick();
          void handleDecrement();
        }}
      >
        -
      </Button>

      <input
        type="text"
        inputMode="numeric"
        value={inputValue}
        onClick={handleInputClick}
        onFocus={handleInputFocus}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onMouseDown={handleInteractiveEvent}
        onPointerDown={handleInteractiveEvent}
        onTouchEnd={handleInteractiveEvent}
        onTouchStart={handleInteractiveEvent}
        disabled={isBusy}
        className="h-7 w-[2.75rem] rounded-sm bg-white text-center text-sm font-medium outline-none"
        aria-label="Количество товара"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={isBusy || isIncrementDisabled}
        aria-label="Увеличить количество"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          suppressNextCardClick();
          void handleIncrement();
        }}
      >
        +
      </Button>
    </div>
  );
};
