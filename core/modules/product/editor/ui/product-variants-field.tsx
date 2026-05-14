"use client";

import { type CreateProductFormValues } from "@/core/modules/product/editor/model/form-config";
import {
  buildVariantMatrixRows,
  normalizeVariantsFormValue,
  type VariantCombinationFormValue,
  type VariantsFormValue,
} from "@/core/modules/product/editor/model/product-variants";
import {
  compactVariantsForAttributes,
  getSelectedValueIds,
  preserveMatchingCombinations,
} from "@/core/modules/product/editor/model/product-variants-field-model";
import { ProductVariantAttributeCard } from "@/core/modules/product/editor/ui/product-variant-attribute-card";
import { ProductVariantAttributeSelector } from "@/core/modules/product/editor/ui/product-variant-attribute-selector";
import { ProductVariantCombinationsPanel } from "@/core/modules/product/editor/ui/product-variant-combinations-panel";
import { type AttributeDto } from "@/shared/api/generated/react-query";
import React from "react";
import { type UseFormReturn } from "react-hook-form";

interface ProductVariantsFieldProps {
  canUseCatalogSaleUnits?: boolean;
  disabled?: boolean;
  discountPercent?: number;
  form: UseFormReturn<CreateProductFormValues>;
  variantAttributes: AttributeDto[];
}

export const ProductVariantsField: React.FC<ProductVariantsFieldProps> = ({
  canUseCatalogSaleUnits = false,
  disabled,
  discountPercent = 0,
  form,
  variantAttributes,
}) => {
  const [attributeToAddId, setAttributeToAddId] = React.useState("");
  const watchedVariants = form.watch("variants");
  const priceFallback = form.watch("price");
  const variants = React.useMemo(
    () => normalizeVariantsFormValue(watchedVariants),
    [watchedVariants],
  );

  const selectedAttributeIds = React.useMemo(
    () => new Set(variants.selectedAttributeIds),
    [variants.selectedAttributeIds],
  );
  const selectedAttributes = React.useMemo(
    () =>
      variants.selectedAttributeIds
        .map((attributeId) =>
          variantAttributes.find((attribute) => attribute.id === attributeId),
        )
        .filter((attribute): attribute is AttributeDto => Boolean(attribute)),
    [variantAttributes, variants.selectedAttributeIds],
  );
  const availableAttributes = React.useMemo(
    () =>
      variantAttributes.filter(
        (attribute) => !selectedAttributeIds.has(attribute.id),
      ),
    [selectedAttributeIds, variantAttributes],
  );
  const matrixRows = React.useMemo(
    () => buildVariantMatrixRows(variants, variantAttributes),
    [variantAttributes, variants],
  );
  const missingValueAttributes = React.useMemo(
    () =>
      selectedAttributes.filter(
        (attribute) => getSelectedValueIds(variants, attribute.id).length === 0,
      ),
    [selectedAttributes, variants],
  );

  React.useEffect(() => {
    if (!availableAttributes.length) {
      if (attributeToAddId) {
        setAttributeToAddId("");
      }
      return;
    }

    if (
      !attributeToAddId ||
      !availableAttributes.some((attribute) => attribute.id === attributeToAddId)
    ) {
      setAttributeToAddId(availableAttributes[0].id);
    }
  }, [attributeToAddId, availableAttributes]);

  React.useEffect(() => {
    const current = normalizeVariantsFormValue(form.getValues("variants"));
    const compacted = compactVariantsForAttributes(current, variantAttributes);

    if (
      JSON.stringify(current.selectedAttributeIds) !==
        JSON.stringify(compacted.selectedAttributeIds) ||
      JSON.stringify(current.selectedValueIdsByAttributeId) !==
        JSON.stringify(compacted.selectedValueIdsByAttributeId)
    ) {
      form.setValue("variants", compacted, { shouldDirty: false });
    }
  }, [form, variantAttributes]);

  const updateVariants = React.useCallback(
    (updater: (current: VariantsFormValue) => VariantsFormValue) => {
      const current = normalizeVariantsFormValue(form.getValues("variants"));
      form.setValue("variants", updater(current), { shouldDirty: true });
    },
    [form],
  );

  const handleAddAttribute = React.useCallback(() => {
    if (!attributeToAddId) {
      return;
    }

    updateVariants((current) => {
      if (current.selectedAttributeIds.includes(attributeToAddId)) {
        return current;
      }

      return {
        ...current,
        selectedAttributeIds: [
          ...current.selectedAttributeIds,
          attributeToAddId,
        ],
        selectedValueIdsByAttributeId: {
          ...current.selectedValueIdsByAttributeId,
          [attributeToAddId]:
            current.selectedValueIdsByAttributeId[attributeToAddId] ?? [],
        },
      };
    });
  }, [attributeToAddId, updateVariants]);

  const handleRemoveAttribute = React.useCallback(
    (attributeId: string) => {
      updateVariants((current) => {
        const selectedAttributeIds = current.selectedAttributeIds.filter(
          (selectedAttributeId) => selectedAttributeId !== attributeId,
        );
        const selectedValueIdsByAttributeId = {
          ...current.selectedValueIdsByAttributeId,
        };
        delete selectedValueIdsByAttributeId[attributeId];

        return {
          ...current,
          selectedAttributeIds,
          selectedValueIdsByAttributeId,
          combinations: preserveMatchingCombinations(
            current,
            selectedAttributeIds,
            variantAttributes,
          ),
        };
      });
    },
    [updateVariants, variantAttributes],
  );

  const handleToggleValue = React.useCallback(
    (attributeId: string, enumValueId: string) => {
      updateVariants((current) => {
        const selectedValueIds =
          current.selectedValueIdsByAttributeId[attributeId] ?? [];
        const nextSelectedValueIds = selectedValueIds.includes(enumValueId)
          ? selectedValueIds.filter((valueId) => valueId !== enumValueId)
          : [...selectedValueIds, enumValueId];

        return {
          ...current,
          selectedValueIdsByAttributeId: {
            ...current.selectedValueIdsByAttributeId,
            [attributeId]: nextSelectedValueIds,
          },
        };
      });
    },
    [updateVariants],
  );

  const setCombinationItem = React.useCallback(
    (key: string, next: VariantCombinationFormValue) => {
      updateVariants((current) => ({
        ...current,
        combinations: {
          ...current.combinations,
          [key]: next,
        },
      }));
    },
    [updateVariants],
  );

  if (variantAttributes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <ProductVariantAttributeSelector
        attributeToAddId={attributeToAddId}
        availableAttributes={availableAttributes}
        disabled={disabled}
        onAdd={handleAddAttribute}
        onAttributeChange={setAttributeToAddId}
      />

      {selectedAttributes.length === 0 ? (
        <div className="pl-0 sm:pl-[200px]">
          <div className="rounded-lg border border-dashed border-border px-3 py-3 text-sm leading-5 text-muted-foreground">
            Добавьте свойство, например размер или цвет, затем отметьте нужные
            значения. Комбинации появятся ниже.
          </div>
        </div>
      ) : (
        <div className="space-y-3 pl-0 sm:pl-[200px]">
          {selectedAttributes.map((attribute) => (
            <ProductVariantAttributeCard
              key={attribute.id}
              attribute={attribute}
              disabled={disabled}
              selectedValueIds={getSelectedValueIds(variants, attribute.id)}
              onRemove={handleRemoveAttribute}
              onToggleValue={handleToggleValue}
            />
          ))}

          <ProductVariantCombinationsPanel
            canUseCatalogSaleUnits={canUseCatalogSaleUnits}
            disabled={disabled}
            discountPercent={discountPercent}
            matrixRows={matrixRows}
            missingValueAttributes={missingValueAttributes}
            priceFallback={priceFallback}
            variantAttributes={variantAttributes}
            onCombinationChange={setCombinationItem}
          />
        </div>
      )}
    </div>
  );
};
