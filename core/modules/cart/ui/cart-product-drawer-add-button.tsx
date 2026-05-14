"use client";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Plus } from "lucide-react";
import React from "react";

interface CartProductDrawerAddButtonProps {
  ariaLabel: string;
  className?: string;
  disabled: boolean;
  isBusy: boolean;
  onAdd: () => Promise<void>;
}

export function CartProductDrawerAddButton({
  ariaLabel,
  className,
  disabled,
  isBusy,
  onAdd,
}: CartProductDrawerAddButtonProps) {
  return (
    <Button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void onAdd();
      }}
      className={cn(
        "shadow-custom cursor-default bg-secondary/70 disabled:opacity-100",
        isBusy && "animate-pulse",
        className,
      )}
      variant="secondary"
      size="icon"
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <Plus />
    </Button>
  );
}
