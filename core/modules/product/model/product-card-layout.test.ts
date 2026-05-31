import { describe, expect, it, vi } from "vitest";

import {
  PRODUCT_CARD_DETAILED_ROW_ESTIMATE_PX,
  PRODUCT_CARD_GRID_BASE_HEIGHT_PX,
  PRODUCT_CARD_GRID_COLUMN_GAP_PX,
  PRODUCT_CARD_GRID_ROW_GAP_PX,
  getProductCardCartMeasurementKey,
  getProductCardGridColumns,
  getProductCardGridRowEstimate,
  getProductCardGridRowMinHeight,
  getProductCardGridStyle,
  getStableProductCardVirtualScrollAdjustment,
  scrollWindowWithStableProductCardMeasurements,
  shouldAdjustProductCardVirtualRowScrollPosition,
} from "./product-card-layout";

describe("product card layout", () => {
  it("uses 360px as the fallback grid row estimate", () => {
    expect(getProductCardGridRowEstimate()).toBe(
      PRODUCT_CARD_GRID_BASE_HEIGHT_PX,
    );
  });

  it("estimates grid rows from measured column width", () => {
    expect(
      getProductCardGridRowEstimate({
        columns: 2,
        listWidth: 390,
      }),
    ).toBe(402);
  });

  it("keeps detailed view as one column", () => {
    expect(
      getProductCardGridColumns({
        isDetailed: true,
        listWidth: 960,
      }),
    ).toBe(1);
  });

  it("caps grid view at four columns on wide screens", () => {
    expect(
      getProductCardGridColumns({
        isDetailed: false,
        listWidth: 1440,
      }),
    ).toBe(4);
  });

  it("builds stable cart measurement keys", () => {
    expect(
      getProductCardCartMeasurementKey({
        quantityByProductId: {
          "product-b": 2,
          "product-a": 1,
        },
        shouldUseCartUi: true,
      }),
    ).toBe("product-a:1|product-b:2");
  });

  it("skips cart measurement key outside cart UI", () => {
    expect(
      getProductCardCartMeasurementKey({
        quantityByProductId: {
          "product-a": 1,
        },
        shouldUseCartUi: false,
      }),
    ).toBe("");
  });

  it("returns grid row min height by view mode", () => {
    expect(getProductCardGridRowMinHeight(false)).toBe(
      PRODUCT_CARD_GRID_BASE_HEIGHT_PX,
    );
    expect(getProductCardGridRowMinHeight(true)).toBe(
      PRODUCT_CARD_DETAILED_ROW_ESTIMATE_PX,
    );
  });

  it("builds grid style from shared gaps", () => {
    expect(getProductCardGridStyle(2)).toEqual({
      columnGap: PRODUCT_CARD_GRID_COLUMN_GAP_PX,
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      rowGap: PRODUCT_CARD_GRID_ROW_GAP_PX,
    });
  });

  it("does not adjust scroll position while measuring rows during upward scroll", () => {
    expect(
      shouldAdjustProductCardVirtualRowScrollPosition(
        { start: 100 },
        24,
        { scrollDirection: "backward", scrollOffset: 300 },
      ),
    ).toBe(false);
  });

  it("keeps forward scroll anchoring for meaningful size changes above viewport", () => {
    expect(
      shouldAdjustProductCardVirtualRowScrollPosition(
        { start: 100 },
        24,
        { scrollDirection: "forward", scrollOffset: 300 },
      ),
    ).toBe(true);
  });

  it("ignores one pixel measurement noise", () => {
    expect(
      shouldAdjustProductCardVirtualRowScrollPosition(
        { start: 100 },
        1,
        { scrollDirection: "forward", scrollOffset: 300 },
      ),
    ).toBe(false);
  });

  it("drops backward scroll corrections from dynamic row measurement", () => {
    expect(
      getStableProductCardVirtualScrollAdjustment({
        adjustments: 24,
        scrollDirection: "backward",
      }),
    ).toBe(0);
  });

  it("keeps forward scroll corrections from dynamic row measurement", () => {
    expect(
      getStableProductCardVirtualScrollAdjustment({
        adjustments: 24,
        scrollDirection: "forward",
      }),
    ).toBe(24);
  });

  it("uses stable measurement adjustment in window scroll", () => {
    const scrollTo = vi.fn();

    scrollWindowWithStableProductCardMeasurements(
      300,
      { adjustments: 40, behavior: "instant" },
      {
        scrollDirection: "backward",
        scrollElement: { scrollTo } as unknown as Window,
        scrollOffset: 260,
      },
    );

    expect(scrollTo).toHaveBeenCalledWith({
      behavior: "instant",
      top: 300,
    });
  });
});
