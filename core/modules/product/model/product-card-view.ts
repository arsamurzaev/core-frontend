import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import { resolveAttributes, toNumberValue } from "@/shared/lib/attributes";
import { calculatePrice } from "@/shared/lib/calculate-price";

const PRODUCT_CARD_FALLBACK_IMAGE_URL = "/not-found-photo.png";
const PRODUCT_CARD_DEFAULT_CURRENCY = "₽";

export interface ProductCardView {
  currency: string;
  description: string;
  discount: number | undefined;
  displayPrice: number;
  hasDiscount: boolean;
  imageUrl: string;
  price: number;
  subtitle: string;
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

export function buildProductCardView(
  data: ProductWithAttributesDto,
): ProductCardView {
  const price = toNumberValue(data.price) ?? 0;
  const {
    description = "",
    subtitle = "",
    currency = PRODUCT_CARD_DEFAULT_CURRENCY,
    discountedPrice,
    discount,
    discountStartAt,
    discountEndAt,
  } = resolveAttributes(data.productAttributes);

  const pricing = calculatePrice({
    price,
    discount,
    discountedPrice,
    discountStartAt,
    discountEndAt,
  });

  return {
    currency,
    description,
    discount: pricing.discountPercent || undefined,
    displayPrice: pricing.totalPrice,
    hasDiscount: pricing.hasDiscount,
    imageUrl: resolveProductCardImageUrl(data),
    price,
    subtitle,
  };
}
