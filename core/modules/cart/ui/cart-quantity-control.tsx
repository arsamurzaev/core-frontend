"use client";

import { cn } from "@/shared/lib/utils";
import {
  Button,
  type ButtonProps,
} from "@/shared/ui/button";
import React from "react";

export const CART_QUANTITY_CONTROL_LABELS = {
  decrease:
    "\u0423\u043c\u0435\u043d\u044c\u0448\u0438\u0442\u044c \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e",
  increase:
    "\u0423\u0432\u0435\u043b\u0438\u0447\u0438\u0442\u044c \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e",
} as const;

type QuantityControlButtonKind = "plain" | "ui-button";

interface CartQuantityControlProps {
  buttonClassName?: string;
  buttonKind?: QuantityControlButtonKind;
  buttonSize?: ButtonProps["size"];
  buttonVariant?: ButtonProps["variant"];
  className?: string;
  decrementButtonClassName?: string;
  decrementContent: React.ReactNode;
  decrementDisabled?: boolean;
  incrementButtonClassName?: string;
  incrementContent: React.ReactNode;
  incrementDisabled?: boolean;
  onClick?: (event: React.SyntheticEvent) => void;
  onDecrement: () => Promise<void> | void;
  onIncrement: () => Promise<void> | void;
  onPointerDown?: (event: React.SyntheticEvent) => void;
  value: React.ReactNode;
  valueClassName?: string;
}

function stopAndRun(
  event: React.MouseEvent<HTMLButtonElement>,
  action: () => Promise<void> | void,
) {
  event.preventDefault();
  event.stopPropagation();
  void action();
}

export function CartQuantityControl({
  buttonClassName,
  buttonKind = "plain",
  buttonSize,
  buttonVariant,
  className,
  decrementButtonClassName,
  decrementContent,
  decrementDisabled = false,
  incrementButtonClassName,
  incrementContent,
  incrementDisabled = false,
  onClick,
  onDecrement,
  onIncrement,
  onPointerDown,
  value,
  valueClassName,
}: CartQuantityControlProps) {
  const decreaseClassName = cn(buttonClassName, decrementButtonClassName);
  const increaseClassName = cn(buttonClassName, incrementButtonClassName);

  return (
    <div onClick={onClick} onPointerDown={onPointerDown} className={className}>
      {buttonKind === "ui-button" ? (
        <Button
          type="button"
          disabled={decrementDisabled}
          onClick={(event) => stopAndRun(event, onDecrement)}
          variant={buttonVariant}
          size={buttonSize}
          className={decreaseClassName}
          aria-label={CART_QUANTITY_CONTROL_LABELS.decrease}
        >
          {decrementContent}
        </Button>
      ) : (
        <button
          type="button"
          disabled={decrementDisabled}
          className={decreaseClassName}
          onClick={(event) => stopAndRun(event, onDecrement)}
          aria-label={CART_QUANTITY_CONTROL_LABELS.decrease}
        >
          {decrementContent}
        </button>
      )}

      <p className={valueClassName}>{value}</p>

      {buttonKind === "ui-button" ? (
        <Button
          type="button"
          disabled={incrementDisabled}
          onClick={(event) => stopAndRun(event, onIncrement)}
          variant={buttonVariant}
          size={buttonSize}
          className={increaseClassName}
          aria-label={CART_QUANTITY_CONTROL_LABELS.increase}
        >
          {incrementContent}
        </Button>
      ) : (
        <button
          type="button"
          disabled={incrementDisabled}
          className={increaseClassName}
          onClick={(event) => stopAndRun(event, onIncrement)}
          aria-label={CART_QUANTITY_CONTROL_LABELS.increase}
        >
          {incrementContent}
        </button>
      )}
    </div>
  );
}
