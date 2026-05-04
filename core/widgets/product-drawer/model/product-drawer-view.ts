"use client";

import type {
  ProductWithAttributesDto,
  ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import { resolveAttributes, toNumberValue } from "@/shared/lib/attributes";
import { calculatePrice } from "@/shared/lib/calculate-price";
import { toOptionalTrimmedString } from "@/shared/lib/text";
import { getCatalogCurrency, type CatalogLike } from "@/shared/lib/utils";

type ProductDrawerEntity = ProductWithAttributesDto | ProductWithDetailsDto;

function parseOptionalDate(value: unknown): Date | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function getProductImageUrls(product: ProductDrawerEntity | null | undefined): string[] {
  const urls =
    product?.media
      ?.slice()
      .sort((left, right) => left.position - right.position)
      .map((entry) => toOptionalTrimmedString(entry.media?.url))
      .filter((value): value is string => Boolean(value)) ?? [];

  return urls.length > 0 ? urls : ["/not-found-photo.png"];
}

function getVariantsSummary(product: ProductDrawerEntity | null | undefined): string | null {
  if (!product || !("variants" in product)) {
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
  previewProduct?: ProductWithAttributesDto | null;
  product: ProductWithDetailsDto | null | undefined;
  supportsBrands?: boolean;
}) {
  const {
    catalog,
    isError,
    isLoading,
    previewProduct,
    product,
    supportsBrands = true,
  } = params;
  const displayProduct = product ?? previewProduct ?? null;
  const attrs = resolveAttributes(displayProduct?.productAttributes);

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

  const price = toNumberValue(displayProduct?.price ?? null) ?? 0;
  const pricing = calculatePrice({
    price,
    discountedPrice,
    discount,
    discountStartAt,
    discountEndAt,
  });

  return {
    brandName: supportsBrands
      ? toOptionalTrimmedString(displayProduct?.brand?.name)
      : null,
    currency,
    description,
    displayName: displayProduct?.name ?? "Товар",
    displayPrice: pricing.totalPrice,
    discount: pricing.discountPercent,
    hasDiscount: pricing.hasDiscount,
    hasError: isError || (!isLoading && !displayProduct),
    imageUrls: getProductImageUrls(displayProduct),
    price,
    shareText: subtitle || description || undefined,
    subtitle,
    variantsSummary: getVariantsSummary(displayProduct),
  };
}
