import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";

export interface ProductCardVariantState {
  isUnavailable: boolean;
  maxQuantity?: number;
  requiresVariantSelection: boolean;
  shouldOpenPicker: boolean;
  singleVariantId?: string;
}

interface ProductCardVariantStateOptions {
  canUseVariants?: boolean;
  shouldEnforceStock?: boolean;
}

export function resolveProductCardVariantState(
  product: ProductWithAttributesDto,
  options: ProductCardVariantStateOptions = {},
): ProductCardVariantState {
  const shouldEnforceStock = options.shouldEnforceStock !== false;
  const hasProductType = Boolean(options.canUseVariants && product.productType?.id);

  if (!hasProductType) {
    return {
      isUnavailable: false,
      requiresVariantSelection: false,
      shouldOpenPicker: false,
    };
  }

  const activeVariantCount = Math.max(
    0,
    product.variantSummary?.activeCount ?? 0,
  );
  const totalStock = Math.max(0, product.variantSummary?.totalStock ?? 0);
  const singleVariantId =
    product.variantSummary?.singleVariantId?.trim() || undefined;
  const hasSingleConcreteVariant =
    activeVariantCount === 1 && Boolean(singleVariantId);
  const requiresVariantSelection =
    activeVariantCount > 0 && !hasSingleConcreteVariant;

  return {
    isUnavailable:
      shouldEnforceStock && activeVariantCount > 0 && totalStock <= 0,
    maxQuantity:
      shouldEnforceStock && hasSingleConcreteVariant ? totalStock : undefined,
    requiresVariantSelection,
    shouldOpenPicker: requiresVariantSelection,
    singleVariantId: hasSingleConcreteVariant ? singleVariantId : undefined,
  };
}
