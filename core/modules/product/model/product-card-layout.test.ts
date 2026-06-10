import { describe, expect, it } from "vitest";

import { PRODUCT_CARD_GRID_BASE_HEIGHT_PX } from "./product-card-layout";

describe("product card layout", () => {
  it("keeps the grid card base height at 360px", () => {
    expect(PRODUCT_CARD_GRID_BASE_HEIGHT_PX).toBe(360);
  });
});
