"use client";

import {
  findProductSaleUnit,
  getProductSaleUnits,
  type ProductSaleUnit,
} from "@/core/modules/product/model/sale-units";
import { getCartItemSaleUnitId } from "@/core/modules/cart/model/cart-line-key";
import { buildProductCardView } from "@/core/modules/product/model/product-card-view";
import type {
  CartItemDto,
  ProductWithAttributesDto,
  ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import { resolveAttributes, toNumberValue } from "@/shared/lib/attributes";
import { calculatePrice } from "@/shared/lib/calculate-price";

const FALLBACK_IMAGE_URL = "/not-found-photo.png";

function resolveCartItemImageUrl(): string {
  return FALLBACK_IMAGE_URL;
}

function getVariantLabel(item: CartItemDto): string {
  const label = item.variant?.label?.trim();
  if (label) {
    return label;
  }

  const values =
    item.variant?.attributes
      ?.map((attribute) => {
        const name = attribute.attribute.displayName || attribute.attribute.key;
        const value =
          attribute.enumValue.displayName || attribute.enumValue.value;
        return value ? `${name}: ${value}` : null;
      })
      .filter((value): value is string => Boolean(value)) ?? [];

  return values.join(", ");
}

type CartItemWithSaleUnit = CartItemDto & {
  baseUnitPrice?: number;
  discountPercent?: number;
  hasDiscount?: boolean;
  saleUnit?: unknown;
  saleUnitId?: string | null;
};

type SaleUnitLabelLike = {
  baseQuantity?: unknown;
  catalogSaleUnit?: {
    name?: unknown;
  };
  label?: unknown;
  name?: unknown;
  title?: unknown;
  unit?: unknown;
};

function formatSaleUnitQuantity(value: unknown): string | null {
  const quantity =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : null;

  if (quantity === null || !Number.isFinite(quantity)) {
    return null;
  }

  return Intl.NumberFormat("ru-RU").format(quantity);
}

function getSaleUnitLabelFromRaw(rawSaleUnit: unknown): string | null {
  const saleUnit = rawSaleUnit as SaleUnitLabelLike | null | undefined;
  const label =
    typeof saleUnit?.catalogSaleUnit?.name === "string" &&
    saleUnit.catalogSaleUnit.name.trim()
      ? saleUnit.catalogSaleUnit.name.trim()
      : typeof saleUnit?.label === "string" && saleUnit.label.trim()
        ? saleUnit.label.trim()
        : typeof saleUnit?.name === "string" && saleUnit.name.trim()
          ? saleUnit.name.trim()
          : typeof saleUnit?.title === "string" && saleUnit.title.trim()
            ? saleUnit.title.trim()
            : typeof saleUnit?.unit === "string" && saleUnit.unit.trim()
              ? saleUnit.unit.trim()
              : null;

  if (!label) {
    return null;
  }

  const quantity = formatSaleUnitQuantity(saleUnit?.baseQuantity);
  return quantity ? `${label}, внутри: ${quantity}` : label;
}

function formatSaleUnitLabel(saleUnit: ProductSaleUnit): string {
  const quantity = formatSaleUnitQuantity(saleUnit.baseQuantity);
  return quantity ? `${saleUnit.label}, внутри: ${quantity}` : saleUnit.label;
}

function getSaleUnitLabel(params: {
  item: CartItemDto;
  product?: ProductWithDetailsDto;
}): string | null {
  const { item, product } = params;
  const itemSaleUnitId = getCartItemSaleUnitId(item);
  const rawLabel = getSaleUnitLabelFromRaw((item as CartItemWithSaleUnit).saleUnit);

  if (rawLabel) {
    return rawLabel;
  }

  if (!itemSaleUnitId) {
    return null;
  }

  const variantSaleUnit =
    item.variantId && product
      ? findProductSaleUnit(
          getProductSaleUnits(
            product.variants.find((variant) => variant.id === item.variantId),
          ),
          itemSaleUnitId,
        )
      : null;
  const productSaleUnit =
    variantSaleUnit ?? findProductSaleUnit(getProductSaleUnits(product), itemSaleUnitId);

  return productSaleUnit ? formatSaleUnitLabel(productSaleUnit) : null;
}

function getBackendPricing(item: CartItemDto) {
  const pricing = item as CartItemWithSaleUnit;
  const baseUnitPrice =
    typeof pricing.baseUnitPrice === "number" && Number.isFinite(pricing.baseUnitPrice)
      ? pricing.baseUnitPrice
      : null;
  const hasDiscount = pricing.hasDiscount === true && baseUnitPrice !== null;

  if (!hasDiscount) {
    return null;
  }

  return {
    displayLineTotal: isCartItemPriceKnown(item) ? item.lineTotal : null,
    hasDiscount: true,
    originalLineTotal: isCartItemPriceKnown(item)
      ? baseUnitPrice * item.quantity
      : null,
  };
}

function isCartItemPriceKnown(item: CartItemDto): boolean {
  const lineTotal = toNumberValue(item.lineTotal);

  return (
    toNumberValue(item.saleUnit?.price ?? null) !== null ||
    toNumberValue(item.variant?.price ?? null) !== null ||
    toNumberValue(item.product.price) !== null ||
    (lineTotal !== null && lineTotal > 0)
  );
}

type CartProductLike = ProductWithAttributesDto | ProductWithDetailsDto;

export interface CartPricingView {
  currency: string;
  displayTotal: number | null;
  hasDiscount: boolean;
  originalTotal: number | null;
}

export interface CartItemView {
  currency: string;
  displayLineTotal: number | null;
  hasDiscount: boolean;
  id: string;
  imageUrl: string;
  name: string;
  originalLineTotal: number | null;
  product?: ProductWithDetailsDto;
  productId: string;
  productSlug: string;
  quantity: number;
  saleUnitId: string | null;
  saleUnitLabel: string | null;
  subtitle: string;
  variantId: string | null;
  variantLabel: string | null;
}

function parseOptionalDate(value: unknown): Date | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function getCartPricingForProduct(
  product: CartProductLike,
  quantity: number,
  fallbackCurrency: string,
): CartPricingView {
  const attrs = resolveAttributes<
    Record<string, string | number | boolean | undefined>
  >(product.productAttributes);
  const currency =
    typeof attrs.currency === "string" && attrs.currency.trim()
      ? attrs.currency.trim()
      : fallbackCurrency;
  const price = toNumberValue(product.price);
  if (price === null) {
    return {
      currency,
      displayTotal: null,
      hasDiscount: false,
      originalTotal: null,
    };
  }

  const discount = toNumberValue(attrs.discount ?? null) ?? undefined;
  const discountedPrice =
    toNumberValue(attrs.discountedPrice ?? null) ?? undefined;
  const discountStartAt = parseOptionalDate(attrs.discountStartAt);
  const discountEndAt = parseOptionalDate(attrs.discountEndAt);
  const pricing = calculatePrice({
    price,
    quantity,
    discount,
    discountedPrice,
    discountStartAt,
    discountEndAt,
  });

  return {
    currency,
    displayTotal: pricing.totalPrice,
    hasDiscount: pricing.hasDiscount,
    originalTotal: pricing.originalPrice * quantity,
  };
}

export function buildCartItemView(params: {
  fallbackCurrency: string;
  item: CartItemDto;
  product?: ProductWithDetailsDto;
}): CartItemView {
  const { fallbackCurrency, item, product } = params;

  if (!product) {
    const variantLabel = getVariantLabel(item);
    const saleUnitLabel = getSaleUnitLabel({ item });
    const backendPricing = getBackendPricing(item);
    return {
      currency: fallbackCurrency,
      displayLineTotal:
        backendPricing?.displayLineTotal ??
        (isCartItemPriceKnown(item) ? item.lineTotal : null),
      hasDiscount: backendPricing?.hasDiscount ?? false,
      id: item.id,
      imageUrl: resolveCartItemImageUrl(),
      name: item.product.name,
      originalLineTotal:
        backendPricing?.originalLineTotal ??
        (isCartItemPriceKnown(item) ? item.lineTotal : null),
      product: undefined,
      productId: item.productId,
      productSlug: item.product.slug,
      quantity: item.quantity,
      saleUnitId: getCartItemSaleUnitId(item),
      saleUnitLabel,
      subtitle: [variantLabel, saleUnitLabel].filter(Boolean).join(" · "),
      variantId: item.variantId,
      variantLabel: variantLabel || null,
    };
  }

  const productCardView = buildProductCardView(
    product as unknown as ProductWithAttributesDto,
  );
  const variantLabel = getVariantLabel(item);
  const saleUnitLabel = getSaleUnitLabel({ item, product });
  const hasKnownItemPrice = isCartItemPriceKnown(item);
  const explicitLineTotal =
    hasKnownItemPrice &&
    (item.variantId || item.variant || saleUnitLabel || getCartItemSaleUnitId(item)) &&
    Number.isFinite(item.lineTotal)
      ? item.lineTotal
      : undefined;
  const backendPricing = getBackendPricing(item);
  const pricing = getCartPricingForProduct(
    product,
    item.quantity,
    fallbackCurrency,
  );

  return {
    currency: pricing.currency,
    displayLineTotal:
      backendPricing?.displayLineTotal ?? explicitLineTotal ?? pricing.displayTotal,
    hasDiscount:
      backendPricing?.hasDiscount ??
      (explicitLineTotal === undefined && pricing.hasDiscount),
    id: item.id,
    imageUrl: productCardView.imageUrl || FALLBACK_IMAGE_URL,
    name: product.name,
    originalLineTotal:
      backendPricing?.originalLineTotal ??
      explicitLineTotal ??
      pricing.originalTotal,
    product,
    productId: item.productId,
    productSlug: item.product.slug,
    quantity: item.quantity,
    saleUnitId: getCartItemSaleUnitId(item),
    saleUnitLabel,
    subtitle:
      [variantLabel, saleUnitLabel].filter(Boolean).join(" · ") ||
      productCardView.subtitle,
    variantId: item.variantId,
    variantLabel: variantLabel || null,
  };
}

export function buildCartTotals(items: CartItemView[]) {
  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.displayLineTotal ?? 0),
    0,
  );
  const originalSubtotal = items.reduce(
    (sum, item) => sum + (item.originalLineTotal ?? 0),
    0,
  );

  return {
    hasDiscount: originalSubtotal > subtotal,
    itemsCount,
    originalSubtotal,
    subtotal,
  };
}
