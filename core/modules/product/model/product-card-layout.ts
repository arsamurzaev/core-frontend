export const PRODUCT_CARD_GRID_BASE_HEIGHT_PX = 360;
export const PRODUCT_CARD_GRID_MIN_WIDTH_PX = 127;
export const PRODUCT_CARD_GRID_MAX_COLUMNS = 4;
export const PRODUCT_CARD_GRID_COLUMN_GAP_PX = 12;
export const PRODUCT_CARD_GRID_ROW_GAP_PX = 12;
export const PRODUCT_CARD_DETAILED_ROW_ESTIMATE_PX = 210;
const PRODUCT_CARD_GRID_NON_IMAGE_ESTIMATE_PX = 150;

interface ProductCardCartMeasurementKeyInput {
  quantityByProductId: Readonly<Record<string, number>>;
  shouldUseCartUi: boolean;
}

interface ProductCardGridColumnsInput {
  isDetailed: boolean;
  listWidth: number;
}

interface ProductCardGridRowEstimateInput {
  columns?: number;
  listWidth?: number;
}

export interface ProductCardGridStyle {
  columnGap: number;
  gridTemplateColumns: string;
  rowGap: number;
}

interface ProductCardVirtualMeasuredItem {
  start: number;
}

interface ProductCardVirtualScrollState {
  scrollDirection: "backward" | "forward" | null;
  scrollOffset: number | null;
}

interface ProductCardWindowVirtualizerState
  extends ProductCardVirtualScrollState {
  scrollElement: Window | null;
}

interface ProductCardVirtualScrollToOptions {
  adjustments?: number;
  behavior?: ScrollBehavior;
}

export function getProductCardCartMeasurementKey({
  quantityByProductId,
  shouldUseCartUi,
}: ProductCardCartMeasurementKeyInput): string {
  if (!shouldUseCartUi) {
    return "";
  }

  return Object.entries(quantityByProductId)
    .sort(([firstId], [secondId]) => firstId.localeCompare(secondId))
    .map(([productId, quantity]) => `${productId}:${quantity}`)
    .join("|");
}

export function getProductCardGridColumns({
  isDetailed,
  listWidth,
}: ProductCardGridColumnsInput): number {
  if (isDetailed || listWidth <= 0) {
    return 1;
  }

  return Math.min(
    PRODUCT_CARD_GRID_MAX_COLUMNS,
    Math.max(
      1,
      Math.floor(
        (listWidth + PRODUCT_CARD_GRID_COLUMN_GAP_PX) /
          (PRODUCT_CARD_GRID_MIN_WIDTH_PX + PRODUCT_CARD_GRID_COLUMN_GAP_PX),
      ),
    ),
  );
}

export function getProductCardGridRowEstimate({
  columns = 0,
  listWidth = 0,
}: ProductCardGridRowEstimateInput = {}): number {
  if (columns <= 0 || listWidth <= 0) {
    return PRODUCT_CARD_GRID_BASE_HEIGHT_PX;
  }

  const totalGap = PRODUCT_CARD_GRID_COLUMN_GAP_PX * Math.max(0, columns - 1);
  const columnWidth = Math.max(0, (listWidth - totalGap) / columns);
  const imageHeight = columnWidth * (4 / 3);

  return Math.max(
    PRODUCT_CARD_GRID_BASE_HEIGHT_PX,
    Math.ceil(imageHeight + PRODUCT_CARD_GRID_NON_IMAGE_ESTIMATE_PX),
  );
}

export function getProductCardGridRowMinHeight(isDetailed: boolean): number {
  return isDetailed
    ? PRODUCT_CARD_DETAILED_ROW_ESTIMATE_PX
    : PRODUCT_CARD_GRID_BASE_HEIGHT_PX;
}

export function getProductCardGridStyle(columns: number): ProductCardGridStyle {
  return {
    columnGap: PRODUCT_CARD_GRID_COLUMN_GAP_PX,
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    rowGap: PRODUCT_CARD_GRID_ROW_GAP_PX,
  };
}

export function shouldAdjustProductCardVirtualRowScrollPosition(
  item: ProductCardVirtualMeasuredItem,
  delta: number,
  instance: ProductCardVirtualScrollState,
): boolean {
  if (instance.scrollDirection === "backward" || Math.abs(delta) <= 1) {
    return false;
  }

  return item.start < (instance.scrollOffset ?? 0);
}

export function getStableProductCardVirtualScrollAdjustment({
  adjustments = 0,
  scrollDirection,
}: {
  adjustments?: number;
  scrollDirection: ProductCardVirtualScrollState["scrollDirection"];
}): number {
  if (scrollDirection === "backward" || Math.abs(adjustments) <= 1) {
    return 0;
  }

  return adjustments;
}

export function scrollWindowWithStableProductCardMeasurements(
  offset: number,
  options: ProductCardVirtualScrollToOptions,
  instance: ProductCardWindowVirtualizerState,
): void {
  const adjustments = getStableProductCardVirtualScrollAdjustment({
    adjustments: options.adjustments,
    scrollDirection: instance.scrollDirection,
  });

  instance.scrollElement?.scrollTo?.({
    top: offset + adjustments,
    behavior: options.behavior,
  });
}
