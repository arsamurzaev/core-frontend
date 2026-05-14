import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
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
  imageUrl: string;
  imageStatus: string | null;
  price: number | undefined;
  pricePrefix: string | null;
  subtitle: string;
}

interface ProductCardViewOptions {
  fallbackCurrency?: string;
  canUseVariants?: boolean;
}

function resolveProductCardImageUrl(data: ProductWithAttributesDto): string {
  return (
    data.media?.[0]?.media?.variants[0]?.url ||
    data.media?.[0]?.media?.url ||
    PRODUCT_CARD_FALLBACK_IMAGE_URL
  );
}

function resolveProductCardImageStatus(
  data: ProductWithAttributesDto,
): string | null {
  return data.media?.[0]?.media?.status ?? null;
}

export function buildProductCardView(
  data: ProductWithAttributesDto,
  options: ProductCardViewOptions = {},
): ProductCardView {
  const canUseVariants = Boolean(options.canUseVariants && data.productType?.id);
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
  const price =
    minVariantPrice !== null && (productPrice !== null || minVariantPrice > 0)
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

  const pricing =
    price !== null
      ? calculatePrice({
          price,
          discount,
          discountedPrice: hasMultipleVariantPrices ? undefined : discountedPrice,
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
    imageUrl: resolveProductCardImageUrl(data),
    imageStatus: resolveProductCardImageStatus(data),
    price: price ?? undefined,
    pricePrefix: hasVariantPriceRange ? "от" : null,
    subtitle,
  };
}
