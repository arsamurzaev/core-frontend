"use client";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Pencil, X } from "lucide-react";

import React from "react";

export interface ProductImageGridItemProps {
  index: number;
  label: string;
  previewUrl: string;
  disabled: boolean;
  isReorderMode: boolean;
  isSwapCandidate: boolean;
  onSelectForSwap: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

export const ProductImageGridItem: React.FC<ProductImageGridItemProps> = ({
  index,
  label,
  previewUrl,
  disabled,
  isReorderMode,
  isSwapCandidate,
  onSelectForSwap,
  onEdit,
  onRemove,
}) => {
  return (
    <li
      className="relative overflow-hidden rounded-lg border transition-shadow hover:shadow-lg"
      data-vaul-no-drag=""
    >
      <button
        type="button"
        onClick={onSelectForSwap}
        disabled={disabled || !isReorderMode}
        data-vaul-no-drag=""
        className={cn(
          "relative block w-full overflow-hidden bg-muted/10",
          isReorderMode && !disabled ? "cursor-pointer" : "cursor-default",
        )}
      >
        <img
          src={previewUrl}
          alt={`Изображение ${index + 1}`}
          className={cn(
            "aspect-[3/4] w-full object-cover transition-opacity",
            isReorderMode && !isSwapCandidate ? "opacity-90" : "opacity-100",
          )}
        />

        <span className="absolute bottom-1.5 left-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {index + 1}
        </span>

        {isReorderMode ? (
          <span
            className={cn(
              "absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[10px] font-medium",
              isSwapCandidate
                ? "bg-primary text-primary-foreground"
                : "bg-background/90 text-foreground",
            )}
          >
            {isSwapCandidate ? "1/2 выбрано" : "выбрать"}
          </span>
        ) : null}

        {isSwapCandidate ? (
          <span className="pointer-events-none absolute inset-0 ring-2 ring-primary ring-offset-2" />
        ) : null}
      </button>

      <Button
        type="button"
        variant="ghost"
        disabled={disabled || isReorderMode}
        className="shadow-custom absolute -right-2 -top-2 z-10 size-6 rounded-full bg-white text-black"
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        aria-label={`Удалить изображение ${index + 1}`}
        data-vaul-no-drag=""
      >
        <X className="size-3.5" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute bottom-1.5 right-1.5 z-10 size-6 rounded-full bg-black/55 text-white hover:bg-black/70"
        onClick={(event) => {
          event.stopPropagation();
          onEdit();
        }}
        disabled={disabled}
        aria-label={`Редактировать изображение ${index + 1}`}
        data-vaul-no-drag=""
      >
        <Pencil className="size-3.5" />
      </Button>

      <div className="px-1.5 pb-1.5 pt-1">
        <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      </div>
    </li>
  );
};
