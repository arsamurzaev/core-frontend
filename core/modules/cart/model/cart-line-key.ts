import type { CartItemDto } from "@/shared/api/generated/react-query";

export function normalizeVariantId(
  variantId?: string | null,
): string | undefined {
  if (!variantId) {
    return undefined;
  }

  const trimmed = variantId.trim();
  return trimmed || undefined;
}

export function normalizeSaleUnitId(
  saleUnitId?: string | null,
): string | undefined {
  if (!saleUnitId) {
    return undefined;
  }

  const trimmed = saleUnitId.trim();
  return trimmed || undefined;
}

export function getCartItemSaleUnitId(item: CartItemDto): string | null {
  return (
    ((item as CartItemDto & { saleUnitId?: string | null }).saleUnitId ?? null)
      ?.trim() || null
  );
}

export function buildCartLineKey(
  productId: string,
  variantId?: string | null,
  saleUnitId?: string | null,
): string {
  return [
    productId,
    normalizeVariantId(variantId) ?? "default",
    normalizeSaleUnitId(saleUnitId) ?? "default",
  ].join(":");
}
