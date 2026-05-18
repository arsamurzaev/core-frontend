import type { CartProductSnapshot } from "@/core/modules/cart/model/cart-context.types";
import { buildProductCardView } from "@/core/modules/product/model/product-card-view";
import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import { toNumberValue } from "@/shared/lib/attributes";

export type CartProductCardSnapshot = CartProductSnapshot &
  Partial<Pick<ProductWithAttributesDto, "productType" | "variantSummary">>;

interface BuildCartProductCardSnapshotOptions {
  canUseVariants?: boolean;
  fallbackCurrency?: string;
}

function normalizeSnapshotPrice(value: number | string | null | undefined) {
  const numericValue = toNumberValue(value ?? null);
  return numericValue === null ? null : String(numericValue);
}

export function buildCartProductCardSnapshot(
  product: ProductWithAttributesDto,
  options: BuildCartProductCardSnapshotOptions = {},
): CartProductCardSnapshot {
  const cardView = buildProductCardView(product, options);
  const cardPrice =
    typeof cardView.displayPrice === "number" &&
    Number.isFinite(cardView.displayPrice)
      ? cardView.displayPrice
      : null;

  return {
    id: product.id,
    name: product.name,
    price: normalizeSnapshotPrice(cardPrice ?? product.price),
    productType: product.productType,
    slug: product.slug,
    variantSummary: product.variantSummary,
  };
}
