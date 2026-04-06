export interface PriceResult {
  unitPrice: number;
  totalPrice: number;
  originalPrice: number;
  hasDiscount: boolean;
  savingsPerUnit: number;
  totalSavings: number;
  discountPercent: number;
  quantity: number;
}

export interface CalculatePriceInput {
  discountedPrice?: number;
  discountStartAt?: Date;
  discountEndAt?: Date;
  quantity?: number;
  discount?: number;
  price: number;
}

function isDiscountActive(
  discountStartAt?: Date | null,
  discountEndAt?: Date | null,
): boolean {
  if (!discountStartAt && !discountEndAt) {
    return true;
  }

  const now = new Date();

  if (discountStartAt && !discountEndAt) {
    return now >= new Date(discountStartAt);
  }

  if (!discountStartAt && discountEndAt) {
    return now <= new Date(discountEndAt);
  }

  if (discountStartAt && discountEndAt) {
    return now >= new Date(discountStartAt) && now <= new Date(discountEndAt);
  }

  return false;
}

export function calculatePrice({
  discountStartAt,
  discountedPrice,
  discountEndAt,
  discount,
  quantity,
  price,
}: CalculatePriceInput): PriceResult {
  const qty = quantity ?? 1;
  const originalPrice = Number(price);
  const isDiscountValid = isDiscountActive(discountStartAt, discountEndAt);

  let unitPrice = originalPrice;
  let discountPercent = 0;

  if (isDiscountValid && discountedPrice != null) {
    unitPrice = Number(discountedPrice);
    discountPercent = Math.round(
      ((originalPrice - unitPrice) / originalPrice) * 100,
    );
  } else if (isDiscountValid && discount) {
    discountPercent = discount;
    unitPrice = Math.round(
      originalPrice - (originalPrice * discountPercent) / 100,
    );
  }

  const hasDiscount = isDiscountValid && unitPrice < originalPrice;
  const savingsPerUnit = hasDiscount ? originalPrice - unitPrice : 0;

  return {
    unitPrice,
    totalPrice: unitPrice * qty,
    originalPrice,
    hasDiscount,
    savingsPerUnit,
    totalSavings: savingsPerUnit * qty,
    discountPercent,
    quantity: qty,
  };
}
