import { isDiscountActive } from "./is-discount-active";

export interface PriceResult {
  /** Цена за единицу товара (с учетом скидки если активна) */
  unitPrice: number;
  /** Общая стоимость (unitPrice * quantity) */
  totalPrice: number;
  /** Оригинальная цена без скидки */
  originalPrice: number;
  /** Активна ли скидка */
  hasDiscount: boolean;
  /** Экономия за единицу */
  savingsPerUnit: number;
  /** Общая экономия */
  totalSavings: number;
  /** Процент скидки */
  discountPercent: number;
  /** Количество товара */
  quantity: number;
}

/**
 * Универсальная функция расчета стоимости товара
 * @param product - товар
 * @param quantity - количество (опционально, берется из product.quantity или = 1)
 */

type Props = {
  discountedPrice?: number;
  discountStartAt?: Date;
  discountEndAt?: Date;
  quantity?: number;
  discount?: number;
  price: number;
};
export const calculatePrice = ({
  discountStartAt,
  discountedPrice,
  discountEndAt,
  discount,
  quantity,
  price,
}: Props): PriceResult => {
  const qty = quantity ?? 1;
  const originalPrice = Number(price);

  const isDiscountValid = isDiscountActive(discountStartAt, discountEndAt);

  let unitPrice: number;
  let discountPercent = 0;

  if (isDiscountValid && discountedPrice != null) {
    // Приоритет: фиксированная цена со скидкой из БД
    unitPrice = Number(discountedPrice);
    discountPercent = Math.round(
      ((originalPrice - unitPrice) / originalPrice) * 100,
    );
  } else if (isDiscountValid && discount) {
    // Расчет по проценту скидки
    discountPercent = discount;
    unitPrice = Math.round(
      originalPrice - (originalPrice * discountPercent) / 100,
    );
  } else {
    // Без скидки
    unitPrice = originalPrice;
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
};

/** Быстрый хелпер: цена за единицу */
export const getUnitPrice = (data: Props): number =>
  calculatePrice(data).unitPrice;

/** Быстрый хелпер: общая стоимость */
export const getTotalPrice = (data: Props): number =>
  calculatePrice(data).totalPrice;
