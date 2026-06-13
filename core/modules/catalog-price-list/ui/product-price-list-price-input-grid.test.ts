import { describe, expect, it } from "vitest";

import { formatPriceListRelationHint } from "./product-price-list-price-input-grid";

describe("formatPriceListRelationHint", () => {
  it("formats package price hint from parent price and multiplier", () => {
    expect(formatPriceListRelationHint("200", "4")).toBe("800 ₽");
  });

  it("keeps decimal catalog price mode", () => {
    expect(formatPriceListRelationHint("12.5", "4", "decimal")).toBe("50 ₽");
    expect(formatPriceListRelationHint("12.35", "4", "decimal")).toBe(
      "49,40 ₽",
    );
  });

  it("does not show hints for empty or zero values", () => {
    expect(formatPriceListRelationHint("", "4")).toBeNull();
    expect(formatPriceListRelationHint("200", "")).toBeNull();
    expect(formatPriceListRelationHint("200", "0")).toBeNull();
  });
});
