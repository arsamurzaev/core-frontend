import { toOptionalTrimmedString } from "@/shared/lib/text";

export type ProductVariantAttributeOrderLike = {
  attribute?: {
    displayName?: unknown;
    displayOrder?: unknown;
    key?: unknown;
  } | null;
  attributeId?: unknown;
  enumValue?: {
    displayName?: unknown;
    displayOrder?: unknown;
    value?: unknown;
  } | null;
  enumValueId?: unknown;
};

export type ProductVariantOrderLike = {
  attributes?: ProductVariantAttributeOrderLike[] | null;
  id?: unknown;
  sku?: unknown;
  variantKey?: unknown;
};

function toDisplayOrder(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function compareText(left: unknown, right: unknown): number {
  return (toOptionalTrimmedString(left) ?? "").localeCompare(
    toOptionalTrimmedString(right) ?? "",
    "ru",
  );
}

export function compareProductVariantAttributes(
  left: ProductVariantAttributeOrderLike,
  right: ProductVariantAttributeOrderLike,
): number {
  return (
    toDisplayOrder(left.attribute?.displayOrder) -
      toDisplayOrder(right.attribute?.displayOrder) ||
    toDisplayOrder(left.enumValue?.displayOrder) -
      toDisplayOrder(right.enumValue?.displayOrder)
  );
}

export function sortProductVariantAttributes<
  TAttribute extends ProductVariantAttributeOrderLike,
>(attributes: readonly TAttribute[] | null | undefined): TAttribute[] {
  return [...(attributes ?? [])].sort(compareProductVariantAttributes);
}

export function compareProductVariants(
  left: ProductVariantOrderLike,
  right: ProductVariantOrderLike,
): number {
  const leftAttributes = sortProductVariantAttributes(left.attributes);
  const rightAttributes = sortProductVariantAttributes(right.attributes);
  const maxLength = Math.max(leftAttributes.length, rightAttributes.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftAttribute = leftAttributes[index];
    const rightAttribute = rightAttributes[index];

    if (!leftAttribute) return 1;
    if (!rightAttribute) return -1;

    const result = compareProductVariantAttributes(leftAttribute, rightAttribute);
    if (result !== 0) return result;
  }

  return (
    compareText(left.variantKey, right.variantKey) ||
    compareText(left.sku, right.sku) ||
    compareText(left.id, right.id)
  );
}

export function sortProductVariants<TVariant extends ProductVariantOrderLike>(
  variants: readonly TVariant[] | null | undefined,
): TVariant[] {
  return [...(variants ?? [])].sort(compareProductVariants);
}
