import {
  findProductSaleUnit,
  getProductSaleUnits,
  getSaleUnitMaxQuantity,
  type ProductSaleUnit,
} from "@/core/modules/product/model/sale-units";
import { isProductVariantPurchasable } from "@/core/widgets/product-drawer/model/product-variant-picker-model";
import { sortProductVariants } from "@/core/modules/product";
import type {
  ProductVariantDto,
  ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import { toNumberValue } from "@/shared/lib/attributes";
import { calculatePrice } from "@/shared/lib/calculate-price";

export interface ProductPurchasePricingInput {
  discount: number;
  displayPrice: number | null;
  hasDiscount: boolean;
  price: number | null;
  selectedSaleUnit: ProductSaleUnit | null;
  selectedVariant: ProductVariantDto | null;
}

export function getSelectableProductVariants(params: {
  canUseProductVariants: boolean;
  product: ProductWithDetailsDto | null;
}): ProductVariantDto[] {
  if (!params.canUseProductVariants || !params.product?.productType?.id) {
    return [];
  }

  return sortProductVariants(params.product.variants);
}

export function getBaseProductVariant(
  product: ProductWithDetailsDto | null,
): ProductVariantDto | null {
  const variants = product?.variants ?? [];
  const defaultVariantId = product?.defaultVariantId?.trim();

  return (
    (defaultVariantId
      ? (variants.find((variant) => variant.id === defaultVariantId) ?? null)
      : null) ??
    variants.find(
      (variant) =>
        variant.kind === "DEFAULT" || variant.variantKey === "default",
    ) ??
    variants.find((variant) => (variant.attributes ?? []).length === 0) ??
    null
  );
}

export function resolveSinglePurchasableProductVariantId(params: {
  shouldEnforceStock?: boolean;
  variants: ProductVariantDto[];
}): string | null {
  const purchasableVariants = params.variants.filter((variant) =>
    isProductVariantPurchasable(variant, {
      shouldEnforceStock: params.shouldEnforceStock,
    }),
  );

  return purchasableVariants.length === 1 ? purchasableVariants[0].id : null;
}

export function resolveProductSaleUnitSource(params: {
  canUseProductVariants: boolean;
  product: ProductWithDetailsDto | null;
  selectedVariant: ProductVariantDto | null;
}): ProductVariantDto | ProductWithDetailsDto | null {
  const { canUseProductVariants, product, selectedVariant } = params;

  return (
    selectedVariant ??
    (canUseProductVariants && product?.productType?.id
      ? product
      : getBaseProductVariant(product))
  );
}

export function getAvailableProductSaleUnits(params: {
  canUseCatalogSaleUnits: boolean;
  product: ProductWithDetailsDto | null;
  saleUnitSource: ProductVariantDto | ProductWithDetailsDto | null;
}): ProductSaleUnit[] {
  if (!params.canUseCatalogSaleUnits) {
    return [];
  }

  return getProductSaleUnits(params.saleUnitSource ?? params.product);
}

export function resolveNextProductSaleUnitId(params: {
  currentSaleUnitId: string | null;
  initialSaleUnitId?: string | null;
  saleUnits: ProductSaleUnit[];
  shouldApplyInitialSaleUnit: boolean;
}): string | null {
  const { currentSaleUnitId, initialSaleUnitId, saleUnits } = params;

  if (!params.shouldApplyInitialSaleUnit) {
    const currentSaleUnit = findProductSaleUnit(saleUnits, currentSaleUnitId);
    if (currentSaleUnit) {
      return currentSaleUnit.id;
    }
  }

  const initialSaleUnit = findProductSaleUnit(saleUnits, initialSaleUnitId);
  if (initialSaleUnit) {
    return initialSaleUnit.id;
  }

  return saleUnits.length === 1 ? saleUnits[0].id : null;
}

export function isProductSaleUnitSelectionRequired(params: {
  saleUnits: ProductSaleUnit[];
  selectedSaleUnit: ProductSaleUnit | null;
}): boolean {
  return params.saleUnits.length > 1 && !params.selectedSaleUnit;
}

export function resolveProductPurchasePricing({
  discount,
  displayPrice,
  hasDiscount,
  price,
  selectedSaleUnit,
  selectedVariant,
}: ProductPurchasePricingInput) {
  const selectedVariantPrice = toNumberValue(selectedVariant?.price ?? null);
  const selectedSaleUnitPrice = selectedSaleUnit?.price ?? null;
  const selectedBasePrice =
    selectedSaleUnitPrice ?? selectedVariantPrice ?? price;
  const selectedPricing =
    selectedBasePrice !== null && hasDiscount && discount > 0
      ? calculatePrice({
          price: selectedBasePrice,
          discount,
        })
      : null;
  const resolvedDisplayPrice =
    selectedPricing?.unitPrice ??
    selectedSaleUnitPrice ??
    selectedVariantPrice ??
    displayPrice;

  return {
    displayPrice: resolvedDisplayPrice,
    hasSelectedDiscount: Boolean(selectedPricing?.hasDiscount),
    selectedBasePrice,
  };
}

export function resolveProductPurchaseTotalPricing(params: {
  displayPrice: number | null;
  quantity: number;
  selectedBasePrice: number | null;
}) {
  const quantity = Math.max(1, Math.trunc(params.quantity));

  return {
    displayPrice:
      params.displayPrice === null ? null : params.displayPrice * quantity,
    selectedBasePrice:
      params.selectedBasePrice === null
        ? null
        : params.selectedBasePrice * quantity,
  };
}

export function resolveProductPurchaseMaxQuantity(params: {
  product: ProductWithDetailsDto | null;
  selectedSaleUnit: ProductSaleUnit | null;
  selectedVariant: ProductVariantDto | null;
  shouldEnforceStock?: boolean;
}): number | undefined {
  if (params.shouldEnforceStock === false) {
    return undefined;
  }

  const stock =
    params.selectedVariant?.stock ??
    getBaseProductVariant(params.product)?.stock ??
    params.product?.stock;

  return getSaleUnitMaxQuantity(stock, params.selectedSaleUnit);
}

export function resolveProductPurchaseEffectiveMaxQuantity(params: {
  cartLineMaxQuantity?: number;
  purchaseMaxQuantity?: number;
}): number | undefined {
  const candidates = [
    params.cartLineMaxQuantity,
    params.purchaseMaxQuantity,
  ].filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value),
  );

  return candidates.length > 0
    ? Math.max(0, Math.min(...candidates))
    : undefined;
}

export function isProductVariantSelectionRequired(params: {
  selectableVariants: ProductVariantDto[];
  selectedVariant: ProductVariantDto | null;
  shouldEnforceStock?: boolean;
}): boolean {
  return (
    params.selectableVariants.length > 0 &&
    !isProductVariantPurchasable(params.selectedVariant, {
      shouldEnforceStock: params.shouldEnforceStock,
    })
  );
}

export function buildProductPurchaseCartSnapshot(params: {
  displayPrice: number | null;
  product: ProductWithDetailsDto | null;
}):
  | {
      id: string;
      name: string;
      price: string | null;
      slug: string;
    }
  | undefined {
  const { displayPrice, product } = params;

  if (!product) {
    return undefined;
  }

  const productPrice = toNumberValue(product.price);
  const price =
    displayPrice !== null &&
    Number.isFinite(displayPrice) &&
    (displayPrice > 0 || productPrice !== null)
      ? displayPrice
      : product.price;

  return {
    id: product.id,
    name: product.name,
    price: price === null ? null : String(price),
    slug: product.slug,
  };
}
