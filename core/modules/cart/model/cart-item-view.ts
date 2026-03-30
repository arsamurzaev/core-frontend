"use client";

import { buildProductCardView } from "@/core/modules/product/model/product-card-view";
import type {
  CartItemDto,
  ProductWithAttributesDto,
  ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import { resolveAttributes, toNumberValue } from "@/shared/lib/attributes";
import { calculatePrice } from "@/shared/lib/calculate-price";

const FALLBACK_IMAGE_URL = "/not-found-photo.png";

type CartProductLike = ProductWithAttributesDto | ProductWithDetailsDto;

export interface CartPricingView {
  currency: string;
  displayTotal: number;
  hasDiscount: boolean;
  originalTotal: number;
}

export interface CartItemView {
  currency: string;
  displayLineTotal: number;
  hasDiscount: boolean;
  id: string;
  imageUrl: string;
  name: string;
  originalLineTotal: number;
  product?: ProductWithDetailsDto;
  productId: string;
  productSlug: string;
  quantity: number;
  subtitle: string;
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
  const attrs = resolveAttributes<Record<
    string,
    string | number | boolean | undefined
  >>(product.productAttributes);
  const currency =
    typeof attrs.currency === "string" && attrs.currency.trim()
      ? attrs.currency.trim()
      : fallbackCurrency;
  const price = toNumberValue(product.price) ?? 0;
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
    return {
      currency: fallbackCurrency,
      displayLineTotal: item.lineTotal,
      hasDiscount: false,
      id: item.id,
      imageUrl: FALLBACK_IMAGE_URL,
      name: item.product.name,
      originalLineTotal: item.lineTotal,
      product: undefined,
      productId: item.productId,
      productSlug: item.product.slug,
      quantity: item.quantity,
      subtitle: "",
    };
  }

  const productCardView = buildProductCardView(
    product as unknown as ProductWithAttributesDto,
  );
  const pricing = getCartPricingForProduct(product, item.quantity, fallbackCurrency);

  return {
    currency: pricing.currency,
    displayLineTotal: pricing.displayTotal,
    hasDiscount: pricing.hasDiscount,
    id: item.id,
    imageUrl: productCardView.imageUrl || FALLBACK_IMAGE_URL,
    name: product.name,
    originalLineTotal: pricing.originalTotal,
    product,
    productId: item.productId,
    productSlug: item.product.slug,
    quantity: item.quantity,
    subtitle: productCardView.subtitle,
  };
}

export function buildCartTotals(items: CartItemView[]) {
  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.displayLineTotal, 0);
  const originalSubtotal = items.reduce(
    (sum, item) => sum + item.originalLineTotal,
    0,
  );

  return {
    hasDiscount: originalSubtotal > subtotal,
    itemsCount,
    originalSubtotal,
    subtotal,
  };
}
