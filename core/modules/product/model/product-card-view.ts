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
  displayPrice: number;
  hasDiscount: boolean;
  imageUrl: string;
  imageStatus: string | null;
  price: number;
  subtitle: string;
}

interface ProductCardViewOptions {
  fallbackCurrency?: string;
}

function resolveProductCardImageUrl(
  data: ProductWithAttributesDto,
): string {
  return (
    data.media?.[0]?.media?.variants[0]?.url ||
    data.media?.[0]?.media?.url ||
    PRODUCT_CARD_FALLBACK_IMAGE_URL
  );
}

function resolveProductCardImageStatus(data: ProductWithAttributesDto): string | null {
  return data.media?.[0]?.media?.status ?? null;
}

export function buildProductCardView(
  data: ProductWithAttributesDto,
  options: ProductCardViewOptions = {},
): ProductCardView {
  const price = toNumberValue(data.price) ?? 0;
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

  const pricing = calculatePrice({
    price,
    discount,
    discountedPrice,
    discountStartAt,
    discountEndAt,
  });

  return {
    currency: displayCurrency,
    description,
    discount: pricing.discountPercent || undefined,
    displayPrice: pricing.totalPrice,
    hasDiscount: pricing.hasDiscount,
    imageUrl: resolveProductCardImageUrl(data),
    imageStatus: resolveProductCardImageStatus(data),
    price,
    subtitle,
  };
}
