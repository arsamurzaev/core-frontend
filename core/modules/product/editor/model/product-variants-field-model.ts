import {
  buildVariantCombinationKey,
  parseVariantCombinationKey,
  type VariantCombinationFormValue,
  type VariantStatus,
  type VariantsFormValue,
} from "./product-variants";
import { type AttributeDto } from "@/shared/api/generated/react-query";
import {
  formatCatalogPrice,
  type CatalogPriceFormatMode,
} from "@/shared/lib/price-format";

export const VARIANT_STATUS_LABEL: Record<VariantStatus, string> = {
  DISABLED: "Не использовать",
  ACTIVE: "В наличии",
  OUT_OF_STOCK: "Нет в наличии",
};

export const VARIANT_STATUS_CLASS: Record<VariantStatus, string> = {
  DISABLED:
    "border-line-subtle bg-surface-base text-text-muted hover:bg-surface-muted",
  ACTIVE:
    "border-status-success/40 bg-status-success-surface text-status-success hover:bg-status-success-surface/80",
  OUT_OF_STOCK:
    "border-status-warning/40 bg-status-warning-surface text-status-warning hover:bg-status-warning-surface/80",
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

export function formatVariantMoney(
  value: number,
  mode: CatalogPriceFormatMode = "integer",
): string {
  return formatCatalogPrice(value, mode);
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
