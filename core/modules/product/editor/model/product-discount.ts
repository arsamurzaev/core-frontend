import type { AttributeDto } from "@/shared/api/generated/react-query";

export const PRODUCT_DISCOUNT_ATTRIBUTE_KEYS = new Set([
  "discount",
  "discountedprice",
  "discountstartat",
  "discountendat",
]);

export function normalizeProductAttributeKey(
  value: string | null | undefined,
): string {
  return (value ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export function isDiscountAttribute(attribute: AttributeDto): boolean {
  return PRODUCT_DISCOUNT_ATTRIBUTE_KEYS.has(
    normalizeProductAttributeKey(attribute.key),
  );
}

export function isDiscountedPriceAttribute(attribute: AttributeDto): boolean {
  return normalizeProductAttributeKey(attribute.key) === "discountedprice";
}

export function findProductAttributeByKey(
  attributes: AttributeDto[],
  key: string,
): AttributeDto | null {
  const normalizedKey = normalizeProductAttributeKey(key);

  return (
    attributes.find(
      (attribute) =>
        normalizeProductAttributeKey(attribute.key) === normalizedKey,
    ) ?? null
  );
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function resolveDiscountPercent(
  productAttributes: AttributeDto[],
  values: Record<string, unknown> | undefined,
): number {
  const discountAttribute = findProductAttributeByKey(
    productAttributes,
    "discount",
  );
  const value = discountAttribute ? toNumber(values?.[discountAttribute.id]) : null;

  if (value === null || value <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function getDiscountAttributeIds(attributes: AttributeDto[]): string[] {
  return attributes.filter(isDiscountAttribute).map((attribute) => attribute.id);
}

export function getDiscountedPriceAttributeId(
  attributes: AttributeDto[],
): string | null {
  return findProductAttributeByKey(attributes, "discountedprice")?.id ?? null;
}

export function filterVisibleDiscountAttributes(
  attributes: AttributeDto[],
  params: {
    hasDiscount: boolean;
    shouldUsePercentDiscountOnly: boolean;
  },
): AttributeDto[] {
  if (!params.hasDiscount) {
    return attributes.filter((attribute) => !isDiscountAttribute(attribute));
  }

  if (!params.shouldUsePercentDiscountOnly) {
    return attributes;
  }

  return attributes.filter(
    (attribute) => !isDiscountedPriceAttribute(attribute),
  );
}

export function isSaleUnitPricingDraftTouched(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const unit = value as Record<string, unknown>;

  return ["catalogSaleUnitId", "catalogSaleUnitName", "label", "price"].some(
    (key) => typeof unit[key] === "string" && unit[key].trim().length > 0,
  );
}
