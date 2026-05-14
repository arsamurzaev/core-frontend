"use client";

import { type AttributeDto } from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import { Trash2 } from "lucide-react";
import React from "react";

interface ProductVariantAttributeCardProps {
  attribute: AttributeDto;
  disabled?: boolean;
  selectedValueIds: string[];
  onRemove: (attributeId: string) => void;
  onToggleValue: (attributeId: string, enumValueId: string) => void;
}

export const ProductVariantAttributeCard: React.FC<
  ProductVariantAttributeCardProps
> = ({ attribute, disabled, selectedValueIds, onRemove, onToggleValue }) => {
  const selectedValueIdSet = React.useMemo(
    () => new Set(selectedValueIds),
    [selectedValueIds],
  );
  const enumValues = attribute.enumValues ?? [];

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">
            {attribute.displayName}
          </div>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onRemove(attribute.id)}
          title="Убрать свойство"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {enumValues.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {enumValues.map((enumValue) => {
            const label = enumValue.displayName || enumValue.value;
            const isSelected = selectedValueIdSet.has(enumValue.id);

            return (
              <button
                key={enumValue.id}
                type="button"
                disabled={disabled}
                onClick={() => onToggleValue(attribute.id, enumValue.id)}
                className={cn(
                  "min-h-8 rounded-full border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
          У свойства пока нет значений.
        </div>
      )}
    </div>
  );
};
