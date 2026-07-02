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
    <div className="space-y-3 rounded-control border border-line-subtle bg-surface-base p-3">
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
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-status-danger-surface hover:text-status-danger disabled:opacity-50"
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
                  "min-h-8 rounded-pill border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  isSelected
                    ? "border-action-primary bg-action-primary/10 text-action-primary"
                    : "border-line-subtle text-text-muted hover:bg-surface-muted",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-control border border-dashed border-line-subtle px-3 py-2 text-sm text-text-muted">
          У свойства пока нет значений.
        </div>
      )}
    </div>
  );
};
