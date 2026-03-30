"use client";

import type { ProductWithDetailsDto } from "@/shared/api/generated/react-query";
import { resolveAttributes, toNumberValue } from "@/shared/lib/attributes";
import { getTotalPrice } from "@/shared/lib/calculate-price";
import { isDiscountActive } from "@/shared/lib/is-discount-active";
import { toOptionalTrimmedString } from "@/shared/lib/text";
import { getCatalogCurrency, type CatalogLike } from "@/shared/lib/utils";

function parseOptionalDate(value: unknown): Date | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function getProductImageUrls(
  product: ProductWithDetailsDto | null | undefined,
): string[] {
  const urls =
    product?.media
      ?.slice()
      .sort((left, right) => left.position - right.position)
      .map((entry) => toOptionalTrimmedString(entry.media?.url))
      .filter((value): value is string => Boolean(value)) ?? [];

  return urls.length > 0 ? urls : ["/not-found-photo.png"];
}

function getVariantsSummary(
  product: ProductWithDetailsDto | null | undefined,
): string | null {
  if (!product) {
    return null;
  }

  const variants = new Set<string>();

  for (const variant of product.variants ?? []) {
    const value = (variant.attributes ?? [])
      .map(
        (attribute) =>
          attribute.enumValue?.displayName ?? attribute.enumValue?.value ?? null,
      )
      .filter((item): item is string => Boolean(item))
      .join(" / ");

    if (value) {
      variants.add(value);
    }
  }

  return variants.size > 0 ? Array.from(variants).join(", ") : null;
}

export function formatProductDrawerPrice(value: number): string {
  return Intl.NumberFormat("ru-RU").format(value);
}

export function buildProductDrawerViewModel(params: {
  catalog: CatalogLike | null | undefined;
  isError: boolean;
  isLoading: boolean;
  product: ProductWithDetailsDto | null | undefined;
}) {
  const { catalog, isError, isLoading, product } = params;
  const attrs = resolveAttributes(product?.productAttributes);

  const subtitle =
    typeof attrs.subtitle === "string" ? attrs.subtitle : "";
  const description =
    typeof attrs.description === "string" ? attrs.description : "";
  const currency =
    toOptionalTrimmedString(attrs.currency) ?? getCatalogCurrency(catalog, "RUB");

  const discount = toNumberValue(attrs.discount ?? null) ?? 0;
  const discountedPrice = toNumberValue(attrs.discountedPrice ?? null) ?? undefined;
  const discountStartAt = parseOptionalDate(attrs.discountStartAt);
  const discountEndAt = parseOptionalDate(attrs.discountEndAt);

  const price = toNumberValue(product?.price ?? null) ?? 0;
  const isDiscountEnabled = isDiscountActive(discountStartAt, discountEndAt);
  const displayPrice = getTotalPrice({
    price,
    discountedPrice,
    discount,
    discountStartAt,
    discountEndAt,
  });

  return {
    brandName: toOptionalTrimmedString(product?.brand?.name),
    currency,
    description,
    displayName: product?.name ?? "Товар",
    displayPrice,
    discount,
    hasDiscount: displayPrice < price && isDiscountEnabled,
    hasError: isError || (!isLoading && !product),
    imageUrls: getProductImageUrls(product),
    price,
    shareText: subtitle || description || undefined,
    subtitle,
    variantsSummary: getVariantsSummary(product),
  };
}
