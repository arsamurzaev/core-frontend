"use client";

import { useCart } from "@/core/modules/cart/model/cart-context";
import { useCartProductControls } from "@/core/modules/cart/ui/use-cart-product-controls";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { confirm } from "@/shared/ui/confirmation";
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
    (e: React.SyntheticEvent) => {
      suppressNextCardClick();
      e.stopPropagation();
    },
    [suppressNextCardClick],
  );

  const handleGuardedClick = React.useCallback((e: React.SyntheticEvent) => {
    if (Date.now() <= suppressCardClickUntilRef.current) {
      e.preventDefault();
    }

    e.stopPropagation();
  }, []);

  const selectInputValue = React.useCallback((input: HTMLInputElement) => {
    window.requestAnimationFrame(() => {
      input.select();
    });
  }, []);

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    suppressNextCardClick();
    e.stopPropagation();
    selectInputValue(e.currentTarget);
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    handleGuardedClick(e);
    selectInputValue(e.currentTarget);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    suppressNextCardClick();
    const raw = e.target.value.replace(/\D/g, "").slice(0, 3);
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
        void setProductQuantity(productId, 0);
      }

      setInputValue("0");
      return;
    }

    const clamped = Math.min(parsed, 999);

    if (clamped !== quantity) {
      void setProductQuantity(productId, clamped);
    }

    setInputValue(String(clamped));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    suppressNextCardClick();
    e.stopPropagation();

    if (e.key === "Enter") {
      e.currentTarget.blur();
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
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          suppressNextCardClick();
          void handleDecrement();
        }}
      >
        −
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
        className="w-[2.75rem] bg-white h-7 rounded-sm text-center text-sm font-medium outline-none"
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
          suppressNextCardClick();
          void handleIncrement();
        }}
      >
        +
      </Button>
    </div>
  );
};
