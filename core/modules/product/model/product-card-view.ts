import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import type { MediaDto } from "@/shared/api/generated/react-query";
import { getProductSaleUnitsSummary } from "@/core/modules/product/model/sale-units";
import { resolveAttributes, toNumberValue } from "@/shared/lib/attributes";
import { calculatePrice } from "@/shared/lib/calculate-price";
import { toOptionalTrimmedString } from "@/shared/lib/text";

const PRODUCT_CARD_FALLBACK_IMAGE_URL = "/not-found-photo.png";
const PRODUCT_CARD_DEFAULT_CURRENCY = "RUB";

export interface ProductCardView {
  currency: string;
  description: string;
  discount: number | undefined;
  displayPrice: number | undefined;
  hasDiscount: boolean;
  imageFallbackUrl: string;
  imageUrl: string;
  imageStatus: string | null;
  price: number | undefined;
  pricePrefix: string | null;
  saleUnitsSummary: string | null;
  subtitle: string;
}

interface ProductCardViewOptions {
  fallbackCurrency?: string;
  canUseVariants?: boolean;
}

function getMediaVariantUrl(
  media: MediaDto | null | undefined,
  role: string,
): string | null {
  const variant = media?.variants.find((entry) =>
    entry.kind.toLowerCase().startsWith(role),
  );

  return toOptionalTrimmedString(variant?.url) ?? null;
}

function getPrimaryProductMedia(data: ProductWithAttributesDto) {
  return (
    data.media
      ?.slice()
      .sort((left, right) => left.position - right.position)
      .find((entry) => Boolean(entry.media))?.media ?? null
  );
}

function resolveProductCardImageUrls(data: ProductWithAttributesDto): {
  fallbackUrl: string;
  url: string;
} {
  const media = getPrimaryProductMedia(data);
  const originalUrl = toOptionalTrimmedString(media?.url);
  const variantUrl =
    getMediaVariantUrl(media, "card") ??
    getMediaVariantUrl(media, "thumb") ??
    getMediaVariantUrl(media, "detail") ??
    toOptionalTrimmedString(media?.variants[0]?.url);

  return {
    fallbackUrl: originalUrl ?? PRODUCT_CARD_FALLBACK_IMAGE_URL,
    url: variantUrl ?? originalUrl ?? PRODUCT_CARD_FALLBACK_IMAGE_URL,
  };
}

function resolveProductCardImageStatus(
  data: ProductWithAttributesDto,
): string | null {
  return getPrimaryProductMedia(data)?.status ?? null;
}

function hasProductVariantSignal(data: ProductWithAttributesDto): boolean {
  return Boolean(
    data.productType?.id ||
      data.requiresVariantSelection ||
      data.defaultVariantId ||
      (data.variantSummary?.activeCount ?? 0) > 0 ||
      (data.variantPickerOptions?.length ?? 0) > 0,
  );
}

export function buildProductCardView(
  data: ProductWithAttributesDto,
  options: ProductCardViewOptions = {},
): ProductCardView {
  const canUseVariants = Boolean(
    options.canUseVariants && hasProductVariantSignal(data),
  );
  const projectionDisplayPrice = toNumberValue(data.displayPrice);
  const projectionMinPrice = toNumberValue(data.minPrice);
  const projectionMaxPrice = toNumberValue(data.maxPrice);
  const minVariantPrice = canUseVariants
    ? toNumberValue(data.variantSummary?.minPrice ?? null)
    : null;
  const maxVariantPrice = canUseVariants
    ? toNumberValue(data.variantSummary?.maxPrice ?? null)
    : null;
  const activeVariantCount = canUseVariants
    ? (data.variantSummary?.activeCount ?? 0)
    : 0;
  const hasVariantPriceRange =
    minVariantPrice !== null &&
    maxVariantPrice !== null &&
    activeVariantCount > 1 &&
    minVariantPrice !== maxVariantPrice;
  const hasMultipleVariantPrices =
    minVariantPrice !== null &&
    maxVariantPrice !== null &&
    activeVariantCount > 1;
  const productPrice = toNumberValue(data.price);
  const hasProjectedPriceState = typeof data.priceState === "string";
  const hasProjectedPriceRange =
    data.priceState === "RANGE" ||
    (projectionMinPrice !== null &&
      projectionMaxPrice !== null &&
      projectionMinPrice !== projectionMaxPrice);
  const price = hasProjectedPriceState
    ? data.priceState === "UNKNOWN"
      ? null
      : (projectionDisplayPrice ?? projectionMinPrice ?? productPrice)
    : minVariantPrice !== null
      ? minVariantPrice
      : productPrice;
  const {
    description = "",
    subtitle = "",
    currency,
    discountedPrice,
    discount,
    discountStartAt,
    discountEndAt,
  } = resolveAttributes(data.productAttributes);
  const fallbackCurrency =
    toOptionalTrimmedString(options.fallbackCurrency) ??
    PRODUCT_CARD_DEFAULT_CURRENCY;
  const displayCurrency = toOptionalTrimmedString(currency) ?? fallbackCurrency;
  const imageUrls = resolveProductCardImageUrls(data);

  const pricing =
    price !== null
      ? calculatePrice({
          price,
          discount,
          discountedPrice:
            hasProjectedPriceRange || hasMultipleVariantPrices
              ? undefined
              : discountedPrice,
          discountStartAt,
          discountEndAt,
        })
      : null;

  return {
    currency: displayCurrency,
    description,
    discount: pricing?.discountPercent || undefined,
    displayPrice: pricing?.totalPrice,
    hasDiscount: pricing?.hasDiscount ?? false,
    imageFallbackUrl: imageUrls.fallbackUrl,
    imageUrl: imageUrls.url,
    imageStatus: resolveProductCardImageStatus(data),
    price: price ?? undefined,
    pricePrefix: hasProjectedPriceRange || hasVariantPriceRange ? "от" : null,
    saleUnitsSummary: getProductSaleUnitsSummary(data),
    subtitle,
  };
}
