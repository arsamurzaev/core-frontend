import {
  buildVariantCombinationKey,
  parseVariantCombinationKey,
  type VariantCombinationFormValue,
  type VariantStatus,
  type VariantsFormValue,
} from "./product-variants";
import { type AttributeDto } from "@/shared/api/generated/react-query";

export const VARIANT_STATUS_LABEL: Record<VariantStatus, string> = {
  DISABLED: "Не использовать",
  ACTIVE: "В наличии",
  OUT_OF_STOCK: "Нет в наличии",
};

export const VARIANT_STATUS_CLASS: Record<VariantStatus, string> = {
  DISABLED: "border-border bg-background text-muted-foreground hover:bg-muted",
  ACTIVE: "border-green-500 bg-green-50 text-green-700 hover:bg-green-100",
  OUT_OF_STOCK: "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100",
};

export const VARIANT_STATUS_OPTIONS: VariantStatus[] = [
  "DISABLED",
  "ACTIVE",
  "OUT_OF_STOCK",
];

export type VariantDiscountPreview = {
  basePrice: number;
  finalPrice: number;
};

export function toPositiveVariantNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

export function formatVariantMoney(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function resolveVariantDiscountPreview(
  price: unknown,
  discountPercent: number,
): VariantDiscountPreview | null {
  const basePrice = toPositiveVariantNumber(price);
  if (basePrice === null || discountPercent <= 0) {
    return null;
  }

  return {
    basePrice,
    finalPrice: Math.round(basePrice * (100 - discountPercent)) / 100,
  };
}

export function getEnumValueLabel(
  attribute: AttributeDto,
  enumValueId: string,
): string {
  const enumValue = (attribute.enumValues ?? []).find(
    (value) => value.id === enumValueId,
  );

  return enumValue?.displayName || enumValue?.value || enumValueId;
}

export function getSelectedValueIds(
  variants: VariantsFormValue,
  attributeId: string,
): string[] {
  return variants.selectedValueIdsByAttributeId[attributeId] ?? [];
}

export function compactVariantsForAttributes(
  value: VariantsFormValue,
  variantAttributes: AttributeDto[],
): VariantsFormValue {
  const attributeById = new Map(
    variantAttributes.map((attribute) => [attribute.id, attribute]),
  );
  const selectedAttributeIds = value.selectedAttributeIds.filter((attributeId) =>
    attributeById.has(attributeId),
  );
  const selectedValueIdsByAttributeId: Record<string, string[]> = {};

  for (const attributeId of selectedAttributeIds) {
    const attribute = attributeById.get(attributeId);
    if (!attribute) {
      continue;
    }

    const allowedValueIds = new Set(
      (attribute.enumValues ?? []).map((enumValue) => enumValue.id),
    );
    selectedValueIdsByAttributeId[attributeId] = (
      value.selectedValueIdsByAttributeId[attributeId] ?? []
    ).filter((enumValueId) => allowedValueIds.has(enumValueId));
  }

  return {
    selectedAttributeIds,
    selectedValueIdsByAttributeId,
    combinations: value.combinations,
  };
}

export function preserveMatchingCombinations(
  current: VariantsFormValue,
  nextSelectedAttributeIds: string[],
  variantAttributes: AttributeDto[],
): Record<string, VariantCombinationFormValue> {
  const nextCombinations = { ...current.combinations };
  const nextSelectedAttributeIdSet = new Set(nextSelectedAttributeIds);

  for (const [key, item] of Object.entries(current.combinations)) {
    const projectedAttributes = parseVariantCombinationKey(key).filter(
      (attribute) => nextSelectedAttributeIdSet.has(attribute.attributeId),
    );

    if (projectedAttributes.length !== nextSelectedAttributeIdSet.size) {
      continue;
    }

    const projectedKey = buildVariantCombinationKey(
      projectedAttributes,
      variantAttributes,
    );
    if (!nextCombinations[projectedKey]) {
      nextCombinations[projectedKey] = item;
    }
  }

  return nextCombinations;
}
