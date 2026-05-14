import type { ProductVariantDto } from "@/shared/api/generated/react-query";

export interface VariantPickerValue {
  id: string;
  label: string;
}

export interface VariantPickerGroup {
  id: string;
  label: string;
  values: VariantPickerValue[];
}

export type VariantSelection = Record<string, string>;

interface VariantAvailabilityOptions {
  shouldEnforceStock?: boolean;
}

export function isProductVariantPurchasable(
  variant: ProductVariantDto | null | undefined,
  options: VariantAvailabilityOptions = {},
): variant is ProductVariantDto {
  if (!variant?.isAvailable) {
    return false;
  }

  return options.shouldEnforceStock === false || variant.stock > 0;
}

export function findKnownProductVariant(
  variants: ProductVariantDto[],
  variantId: string | null | undefined,
): ProductVariantDto | null {
  return variantId
    ? (variants.find((variant) => variant.id === variantId) ?? null)
    : null;
}

export function getInitialProductVariantId(params: {
  initialVariantId?: string | null;
  queryVariantId: string | null;
  shouldEnforceStock?: boolean;
  singleVariantId?: string | null;
  variants: ProductVariantDto[];
}): string | null {
  const {
    initialVariantId,
    queryVariantId,
    shouldEnforceStock,
    singleVariantId,
    variants,
  } = params;

  const initialVariant = findKnownProductVariant(
    variants,
    initialVariantId ?? null,
  );
  if (initialVariant) {
    return initialVariant.id;
  }

  const queryVariant = findKnownProductVariant(variants, queryVariantId);
  if (
    isProductVariantPurchasable(queryVariant, {
      shouldEnforceStock,
    })
  ) {
    return queryVariant.id;
  }

  const singleVariant = findKnownProductVariant(
    variants,
    singleVariantId ?? null,
  );
  if (
    isProductVariantPurchasable(singleVariant, {
      shouldEnforceStock,
    })
  ) {
    return singleVariant.id;
  }

  return (
    variants.find((variant) =>
      isProductVariantPurchasable(variant, {
        shouldEnforceStock,
      }),
    )?.id ?? null
  );
}

export function buildProductVariantSelection(
  variant: ProductVariantDto,
): VariantSelection {
  return Object.fromEntries(
    variant.attributes.map((attribute) => [
      attribute.attributeId,
      attribute.enumValueId,
    ]),
  );
}

export function productVariantMatchesSelection(
  variant: ProductVariantDto,
  selection: VariantSelection,
): boolean {
  const variantSelection = buildProductVariantSelection(variant);

  return Object.entries(selection).every(
    ([attributeId, enumValueId]) => variantSelection[attributeId] === enumValueId,
  );
}

export function productVariantHasValue(
  variant: ProductVariantDto,
  attributeId: string,
  enumValueId: string,
): boolean {
  return variant.attributes.some(
    (attribute) =>
      attribute.attributeId === attributeId &&
      attribute.enumValueId === enumValueId,
  );
}

export function buildProductVariantGroups(
  variants: ProductVariantDto[],
): VariantPickerGroup[] {
  const groups = new Map<string, VariantPickerGroup>();

  for (const variant of variants) {
    for (const attribute of variant.attributes) {
      const group = groups.get(attribute.attributeId) ?? {
        id: attribute.attributeId,
        label:
          attribute.attribute.displayName ||
          attribute.attribute.key ||
          attribute.attributeId,
        values: [],
      };

      if (!group.values.some((value) => value.id === attribute.enumValueId)) {
        group.values.push({
          id: attribute.enumValueId,
          label:
            attribute.enumValue.displayName ||
            attribute.enumValue.value ||
            attribute.enumValueId,
        });
      }

      groups.set(attribute.attributeId, group);
    }
  }

  return Array.from(groups.values());
}

export function findBestProductVariant(
  variants: ProductVariantDto[],
  selection: VariantSelection,
  options: VariantAvailabilityOptions = {},
): ProductVariantDto | null {
  return (
    variants.find(
      (variant) =>
        isProductVariantPurchasable(variant, options) &&
        productVariantMatchesSelection(variant, selection),
    ) ?? null
  );
}

export function isProductVariantValueSelectable(params: {
  attributeId: string;
  enumValueId: string;
  shouldEnforceStock?: boolean;
  variants: ProductVariantDto[];
}): boolean {
  const { attributeId, enumValueId, shouldEnforceStock, variants } = params;

  return variants.some(
    (variant) =>
      isProductVariantPurchasable(variant, {
        shouldEnforceStock,
      }) && productVariantHasValue(variant, attributeId, enumValueId),
  );
}
