"use client";

import type {
  ProductAttributeDto,
  ProductWithAttributesDto,
  ProductWithDetailsDto,
  ProductAttributeRefDtoDataType,
} from "@/shared/api/generated/react-query";
import {
  parseAttributes,
  type ParsedAttribute,
  type ParsedAttributeValue,
  resolveAttributes,
  toNumberValue,
} from "@/shared/lib/attributes";
import { calculatePrice } from "@/shared/lib/calculate-price";
import { toOptionalTrimmedString } from "@/shared/lib/text";
import { getCatalogCurrency, type CatalogLike } from "@/shared/lib/utils";

type ProductDrawerEntity = ProductWithAttributesDto | ProductWithDetailsDto;

export interface ProductDrawerAttributeRow {
  id: string;
  label: string;
  value: string;
}

export interface ProductDrawerViewModel {
  attributeRows: ProductDrawerAttributeRow[];
  brandName: string | null;
  currency: string;
  description: string;
  displayName: string;
  displayPrice: number;
  discount: number;
  hasDiscount: boolean;
  hasError: boolean;
  imageUrls: string[];
  price: number;
  shareText?: string;
  subtitle: string;
  variantsSummary: string | null;
}

const SYSTEM_ATTRIBUTE_KEYS = new Set([
  "currency",
  "description",
  "discount",
  "discountedprice",
  "discountendat",
  "discountstartat",
  "subtitle",
]);

function parseOptionalDate(value: unknown): Date | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function normalizeAttributeKey(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function formatDateAttributeValue(value: string): string {
  const date = parseOptionalDate(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle:
      date.getHours() === 0 &&
      date.getMinutes() === 0 &&
      date.getSeconds() === 0
        ? undefined
        : "short",
  }).format(date);
}

function formatAttributeValue(
  value: ParsedAttributeValue,
  dataType: ProductAttributeRefDtoDataType,
): string | null {
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    return dataType === "DATETIME"
      ? formatDateAttributeValue(normalized)
      : normalized;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? Intl.NumberFormat("ru-RU").format(value)
      : null;
  }

  if (typeof value === "boolean") {
    return value ? "Да" : "Нет";
  }

  return null;
}

function compareAttributeRows(left: ParsedAttribute, right: ParsedAttribute) {
  return (
    left.raw.attribute.displayOrder - right.raw.attribute.displayOrder ||
    left.displayName.localeCompare(right.displayName, "ru") ||
    left.attributeId.localeCompare(right.attributeId)
  );
}

function shouldShowDrawerAttribute(attribute: ProductAttributeDto): boolean {
  const meta = attribute.attribute;

  if (meta.isHidden || meta.isVariantAttribute) {
    return false;
  }

  return !SYSTEM_ATTRIBUTE_KEYS.has(normalizeAttributeKey(meta.key));
}

function buildDrawerAttributeRows(
  product: ProductDrawerEntity | null | undefined,
): ProductDrawerAttributeRow[] {
  const parsedAttributes = Object.values(
    parseAttributes(product?.productAttributes),
  );

  return parsedAttributes
    .filter((entry) => shouldShowDrawerAttribute(entry.raw))
    .sort(compareAttributeRows)
    .map<ProductDrawerAttributeRow | null>((entry) => {
      const value = formatAttributeValue(entry.value, entry.dataType);

      if (!value) {
        return null;
      }

      return {
        id: entry.attributeId,
        label: entry.displayName,
        value,
      };
    })
    .filter((row): row is ProductDrawerAttributeRow => row !== null);
}

function hasProductAttributes(
  product: ProductDrawerEntity | null | undefined,
): boolean {
  return (product?.productAttributes?.length ?? 0) > 0;
}

function resolveAttributeProduct(
  product: ProductDrawerEntity | null | undefined,
  previewProduct: ProductDrawerEntity | null | undefined,
): ProductDrawerEntity | null {
  if (hasProductAttributes(product)) {
    return product ?? null;
  }

  if (hasProductAttributes(previewProduct)) {
    return previewProduct ?? null;
  }

  return product ?? previewProduct ?? null;
}

function getProductImageUrls(
  product: ProductDrawerEntity | null | undefined,
): string[] {
  const urls =
    product?.media
      ?.slice()
      .sort((left, right) => left.position - right.position)
      .map((entry) => toOptionalTrimmedString(entry.media?.url))
      .filter((value): value is string => Boolean(value)) ?? [];

  return urls.length > 0 ? urls : ["/not-found-photo.png"];
}

function getFullVariantsSummary(
  product: ProductDrawerEntity | null | undefined,
): string | null {
  if (!product?.productType?.id || !("variants" in product)) {
    return null;
  }

  const variants = new Set<string>();

  for (const variant of product.variants ?? []) {
    const value = (variant.attributes ?? [])
      .map(
        (attribute) =>
          attribute.enumValue?.displayName ??
          attribute.enumValue?.value ??
          null,
      )
      .filter((item): item is string => Boolean(item))
      .join(" / ");

    if (value) {
      variants.add(value);
    }
  }

  return variants.size > 0 ? Array.from(variants).join(", ") : null;
}

function getVariantPickerOptionsSummary(
  product: ProductDrawerEntity | null | undefined,
): string | null {
  if (!product?.productType?.id) {
    return null;
  }

  const labels = new Set(
    (product.variantPickerOptions ?? [])
      .map((option) => toOptionalTrimmedString(option.label))
      .filter((label): label is string => Boolean(label)),
  );

  return labels.size > 0 ? Array.from(labels).join(", ") : null;
}

function getVariantsSummary(
  product: ProductDrawerEntity | null | undefined,
  previewProduct: ProductDrawerEntity | null | undefined,
): string | null {
  return (
    getFullVariantsSummary(product) ??
    getVariantPickerOptionsSummary(product) ??
    getVariantPickerOptionsSummary(previewProduct)
  );
}

function getActiveVariantCount(
  product: ProductDrawerEntity | null | undefined,
): number {
  if (!product?.productType?.id) {
    return 0;
  }

  if ("variants" in product && product.variants.length > 0) {
    return product.variants.filter((variant) => variant.status !== "DISABLED")
      .length;
  }

  return product.variantSummary?.activeCount ?? 0;
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
}): ProductDrawerViewModel {
  const {
    catalog,
    isError,
    isLoading,
    previewProduct,
    product,
    supportsBrands = true,
  } = params;
  const displayProduct = product ?? previewProduct ?? null;
  const attributeProduct = resolveAttributeProduct(product, previewProduct);
  const attrs = resolveAttributes(attributeProduct?.productAttributes);

  const subtitle = typeof attrs.subtitle === "string" ? attrs.subtitle : "";
  const description =
    typeof attrs.description === "string" ? attrs.description : "";
  const currency =
    toOptionalTrimmedString(attrs.currency) ??
    getCatalogCurrency(catalog, "RUB");

  const discount = toNumberValue(attrs.discount ?? null) ?? 0;
  const discountedPrice =
    toNumberValue(attrs.discountedPrice ?? null) ?? undefined;
  const discountStartAt = parseOptionalDate(attrs.discountStartAt);
  const discountEndAt = parseOptionalDate(attrs.discountEndAt);

  const price = toNumberValue(displayProduct?.price ?? null) ?? 0;
  const hasMultipleVariants = getActiveVariantCount(displayProduct) > 1;
  const pricing = calculatePrice({
    price,
    discountedPrice: hasMultipleVariants ? undefined : discountedPrice,
    discount,
    discountStartAt,
    discountEndAt,
  });

  return {
    attributeRows: buildDrawerAttributeRows(attributeProduct),
    brandName: supportsBrands
      ? (toOptionalTrimmedString(displayProduct?.brand?.name) ?? null)
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
    shareText: displayProduct?.name,
    subtitle,
    variantsSummary: getVariantsSummary(product, previewProduct),
  };
}
