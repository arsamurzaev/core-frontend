"use client";

import {
  buildProductVariantGroups,
  buildProductVariantSelection,
  findBestProductVariant,
  isProductVariantPurchasable,
  isProductVariantValueSelectable,
  productVariantHasValue,
} from "@/core/widgets/product-drawer/model/product-variant-picker-model";
import type { ProductVariantDto } from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import React from "react";

interface ProductVariantPickerProps {
  currency: string;
  onChange: (variantId: string) => void;
  selectedVariantId: string | null;
  shouldEnforceStock?: boolean;
  variants: ProductVariantDto[];
}

export function ProductVariantPicker({
  onChange,
  selectedVariantId,
  shouldEnforceStock,
  variants,
}: ProductVariantPickerProps) {
  const groups = React.useMemo(
    () => buildProductVariantGroups(variants),
    [variants],
  );
  const selectedVariant = React.useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId) ?? null,
    [selectedVariantId, variants],
  );
  const selection = React.useMemo(
    () =>
      selectedVariant ? buildProductVariantSelection(selectedVariant) : {},
    [selectedVariant],
  );

  if (variants.length <= 1 || groups.length === 0) {
    return null;
  }

  const handleValueClick = (attributeId: string, enumValueId: string) => {
    const nextSelection = { ...selection, [attributeId]: enumValueId };
    const nextVariant =
      findBestProductVariant(variants, nextSelection, {
        shouldEnforceStock,
      }) ??
      variants.find(
        (variant) =>
          isProductVariantPurchasable(variant, {
            shouldEnforceStock,
          }) && productVariantHasValue(variant, attributeId, enumValueId),
      ) ??
      null;

    if (nextVariant) {
      onChange(nextVariant.id);
    }
  };

  return (
    <div className="space-y-4 px-4 pb-4">
      {groups.map((group) => (
        <div key={group.id} className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            {group.label}
          </div>
          <div className="flex flex-wrap gap-2">
            {group.values.map((value) => {
              const isSelected = selection[group.id] === value.id;
              const isDisabled = !isProductVariantValueSelectable({
                attributeId: group.id,
                enumValueId: value.id,
                shouldEnforceStock,
                variants,
              });

              return (
                <Button
                  key={value.id}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  disabled={isDisabled}
                  onClick={() => handleValueClick(group.id, value.id)}
                  className={cn(
                    "h-9 min-w-12 rounded-full px-3 text-sm",
                    isSelected && "shadow-custom",
                  )}
                >
                  {value.label}
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
