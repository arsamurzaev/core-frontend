import {
  isProductVariantSelectable,
  type ProductVariantAvailabilityState,
  resolveProductVariantAvailability,
} from "./product-variant-availability";

export interface ProductVariantSelectionOption {
  id: string;
  isAvailable?: boolean | null;
  maxQuantity?: number | null;
  status?: string | null;
  stock?: number | null;
}

export interface ResolvedProductVariantSelection<
  TVariant extends ProductVariantSelectionOption,
> {
  isSelectedVariantSelectable: boolean;
  selectedVariant: TVariant | null;
  selectedVariantAvailability: ProductVariantAvailabilityState | null;
  selectedVariantId: string | null;
}

interface ProductVariantSelectionOptions {
  shouldEnforceStock?: boolean;
}

export function normalizeProductVariantId(
  variantId: string | null | undefined,
): string | null {
  const trimmed = variantId?.trim();
  return trimmed ? trimmed : null;
}

export function findKnownProductVariantOption<
  TVariant extends ProductVariantSelectionOption,
>(variants: TVariant[], variantId: string | null | undefined): TVariant | null {
  const normalizedVariantId = normalizeProductVariantId(variantId);

  return normalizedVariantId
    ? (variants.find((variant) => variant.id === normalizedVariantId) ?? null)
    : null;
}

export function isProductVariantOptionSelectable<
  TVariant extends ProductVariantSelectionOption,
>(
  variant: TVariant | null | undefined,
  options: ProductVariantSelectionOptions = {},
): variant is TVariant {
  return isProductVariantSelectable(variant, options);
}

export function resolveInitialProductVariantId<
  TVariant extends ProductVariantSelectionOption,
>(params: {
  initialVariantId?: string | null;
  queryVariantId?: string | null;
  shouldEnforceStock?: boolean;
  shouldSelectFirstVariant?: boolean;
  singleVariantId?: string | null;
  variants: TVariant[];
}): string | null {
  const {
    initialVariantId,
    queryVariantId,
    shouldEnforceStock,
    singleVariantId,
    variants,
  } = params;

  const initialVariant = findKnownProductVariantOption(
    variants,
    initialVariantId,
  );
  if (
    isProductVariantOptionSelectable(initialVariant, {
      shouldEnforceStock,
    })
  ) {
    return initialVariant.id;
  }

  const queryVariant = findKnownProductVariantOption(variants, queryVariantId);
  if (
    isProductVariantOptionSelectable(queryVariant, {
      shouldEnforceStock,
    })
  ) {
    return queryVariant.id;
  }

  const singleVariant = findKnownProductVariantOption(
    variants,
    singleVariantId,
  );
  if (
    isProductVariantOptionSelectable(singleVariant, {
      shouldEnforceStock,
    })
  ) {
    return singleVariant.id;
  }

  if (params.shouldSelectFirstVariant === false) {
    return null;
  }

  return (
    variants.find((variant) =>
      isProductVariantOptionSelectable(variant, {
        shouldEnforceStock,
      }),
    )?.id ?? null
  );
}

export function resolveProductVariantSelection<
  TVariant extends ProductVariantSelectionOption,
>(params: {
  selectedVariantId?: string | null;
  shouldEnforceStock?: boolean;
  variants: TVariant[];
}): ResolvedProductVariantSelection<TVariant> {
  const selectedVariant = findKnownProductVariantOption(
    params.variants,
    params.selectedVariantId,
  );
  const selectedVariantAvailability = selectedVariant
    ? resolveProductVariantAvailability(selectedVariant, {
        shouldEnforceStock: params.shouldEnforceStock,
      })
    : null;

  return {
    isSelectedVariantSelectable:
      selectedVariantAvailability?.isSelectable ?? false,
    selectedVariant,
    selectedVariantAvailability,
    selectedVariantId: selectedVariant?.id ?? null,
  };
}
