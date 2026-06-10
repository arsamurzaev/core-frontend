type PriceListPricedItem = {
  price?: unknown;
  saleUnitPrice?: unknown;
  saleUnits?: Array<{ price?: unknown }> | null;
};

function hasResolvedPrice(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return true;
}

function productUsesPriceList(product: unknown): boolean {
  return (
    typeof product === "object" &&
    product !== null &&
    (product as { usesPriceList?: unknown }).usesPriceList === true
  );
}

export function hasActivePriceListPrice(
  item: PriceListPricedItem | null | undefined,
): boolean {
  if (!item) {
    return false;
  }

  return (
    hasResolvedPrice(item.price) ||
    hasResolvedPrice(item.saleUnitPrice) ||
    Boolean(
      item.saleUnits?.some((saleUnit) => hasResolvedPrice(saleUnit.price)),
    )
  );
}

export function isVisibleForActivePriceList(
  product: unknown,
  item: PriceListPricedItem | null | undefined,
): boolean {
  return productUsesPriceList(product) ? hasActivePriceListPrice(item) : true;
}

export function filterActivePriceListVisibleItems<
  TItem extends PriceListPricedItem,
>(product: unknown, items: readonly TItem[]): TItem[] {
  return productUsesPriceList(product)
    ? items.filter((item) => hasActivePriceListPrice(item))
    : [...items];
}
