import type { CartItemDto } from "@/shared/api/generated/react-query";

export interface CartLineModifierSelection {
  groupName?: string;
  optionName?: string;
  productModifierGroupId: string;
  productModifierOptionId: string;
  quantity?: number | null;
  unitPrice?: number | string | null;
}

export interface NormalizedCartLineModifierSelection {
  groupName?: string;
  optionName?: string;
  productModifierGroupId: string;
  productModifierOptionId: string;
  quantity: number;
  unitPrice?: number | string | null;
}

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

function normalizeModifierQuantity(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.trunc(value))
    : 1;
}

export function normalizeCartLineModifiers(
  modifiers?: CartLineModifierSelection[] | null,
): NormalizedCartLineModifierSelection[] {
  const byKey = new Map<string, NormalizedCartLineModifierSelection>();

  for (const modifier of modifiers ?? []) {
    const productModifierGroupId = modifier.productModifierGroupId.trim();
    const productModifierOptionId = modifier.productModifierOptionId.trim();

    if (!productModifierGroupId || !productModifierOptionId) {
      continue;
    }

    const key = `${productModifierGroupId}:${productModifierOptionId}`;
    const current = byKey.get(key);
    const quantity = normalizeModifierQuantity(modifier.quantity);

    if (current) {
      current.quantity += quantity;
      continue;
    }

    byKey.set(key, {
      productModifierGroupId,
      productModifierOptionId,
      quantity,
      ...(modifier.groupName?.trim()
        ? { groupName: modifier.groupName.trim() }
        : {}),
      ...(modifier.optionName?.trim()
        ? { optionName: modifier.optionName.trim() }
        : {}),
      ...(modifier.unitPrice !== undefined ? { unitPrice: modifier.unitPrice } : {}),
    });
  }

  return Array.from(byKey.values()).sort(
    (left, right) =>
      left.productModifierGroupId.localeCompare(right.productModifierGroupId) ||
      left.productModifierOptionId.localeCompare(right.productModifierOptionId),
  );
}

export function buildCartLineModifierSignature(
  modifiers?: CartLineModifierSelection[] | null,
): string {
  return normalizeCartLineModifiers(modifiers)
    .map(
      (modifier) =>
        `${modifier.productModifierGroupId}:${modifier.productModifierOptionId}x${modifier.quantity}`,
    )
    .join("|");
}

export function getCartItemSaleUnitId(item: CartItemDto): string | null {
  return (
    ((item as CartItemDto & { saleUnitId?: string | null }).saleUnitId ?? null)
      ?.trim() || null
  );
}

export function getCartItemModifiers(
  item: CartItemDto,
): CartLineModifierSelection[] {
  const modifiers = (
    item as CartItemDto & {
      modifiers?: Array<{
        groupName?: string | null;
        optionName?: string | null;
        productModifierGroupId?: string | null;
        productModifierOptionId?: string | null;
        quantity?: number | null;
        unitPrice?: number | string | null;
      }> | null;
    }
  ).modifiers;

  return normalizeCartLineModifiers(
    (modifiers ?? []).map((modifier) => ({
      groupName: modifier.groupName ?? undefined,
      optionName: modifier.optionName ?? undefined,
      productModifierGroupId: modifier.productModifierGroupId ?? "",
      productModifierOptionId: modifier.productModifierOptionId ?? "",
      quantity: modifier.quantity ?? 1,
      unitPrice: modifier.unitPrice ?? null,
    })),
  );
}

export function buildCartLineKey(
  productId: string,
  variantId?: string | null,
  saleUnitId?: string | null,
  modifiers?: CartLineModifierSelection[] | null,
): string {
  return [
    productId,
    normalizeVariantId(variantId) ?? "default",
    normalizeSaleUnitId(saleUnitId) ?? "default",
    buildCartLineModifierSignature(modifiers) || "default",
  ].join(":");
}
