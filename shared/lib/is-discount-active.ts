export function isDiscountActive(
  discountStartAt?: Date | null,
  discountEndAt?: Date | null,
): boolean {
  // Если дат нет — скидка активна всегда
  if (!discountStartAt && !discountEndAt) {
    return true;
  }

  const now = new Date();

  // Если есть только дата начала
  if (discountStartAt && !discountEndAt) {
    const startDate = new Date(discountStartAt);
    return now >= startDate;
  }

  // Если есть только дата окончания
  if (!discountStartAt && discountEndAt) {
    const endDate = new Date(discountEndAt);
    return now <= endDate;
  }

  // Если есть обе даты
  if (discountStartAt && discountEndAt) {
    const startDate = new Date(discountStartAt);
    const endDate = new Date(discountEndAt);
    return now >= startDate && now <= endDate;
  }

  return false;
}
