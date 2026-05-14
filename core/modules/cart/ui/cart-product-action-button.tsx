"use client";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Plus } from "lucide-react";
import React from "react";

interface CartProductActionButtonProps {
  ariaLabel: string;
  className?: string;
  disabled: boolean;
  isBusy: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  quantity: number;
  shouldShowQuantity: boolean;
}

export function CartProductActionButton({
  ariaLabel,
  className,
  disabled,
  isBusy,
  onClick,
  quantity,
  shouldShowQuantity,
}: CartProductActionButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className={cn(
        "shadow-custom absolute top-[10px] right-[10px] z-20 cursor-default bg-secondary/70 disabled:opacity-100",
        isBusy && "animate-pulse",
        className,
      )}
      variant="secondary"
      size="icon"
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {shouldShowQuantity ? <p>{quantity}</p> : <Plus />}
    </Button>
  );
}
