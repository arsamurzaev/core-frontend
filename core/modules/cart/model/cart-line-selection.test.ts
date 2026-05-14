import { describe, expect, it } from "vitest";
import {
  buildCartLineSelectionKey,
  getCartLineSelectionQuantity,
  normalizeCartLineSelection,
  shouldUseLineQuantity,
} from "./cart-line-selection";

describe("cart line selection", () => {
  it("normalizes optional variant and sale unit ids", () => {
    expect(
      normalizeCartLineSelection({
        productId: " product-1 ",
        saleUnitId: " kg ",
        variantId: " variant-1 ",
      }),
    ).toEqual({
      productId: "product-1",
      saleUnitId: "kg",
      variantId: "variant-1",
    });
  });

  it("builds stable line keys", () => {
    expect(
      buildCartLineSelectionKey({
        productId: "product-1",
        saleUnitId: "kg",
        variantId: "variant-1",
      }),
    ).toBe("product-1:variant-1:kg");
  });

  it("reads product or line quantity depending on selection scope", () => {
    const quantityByProductId = { "product-1": 5 };
    const quantityByLineKey = { "product-1:variant-1:kg": 2 };

    expect(
      getCartLineSelectionQuantity({
        quantityByLineKey,
        quantityByProductId,
        selection: { productId: "product-1" },
      }),
    ).toBe(5);

    expect(
      getCartLineSelectionQuantity({
        quantityByLineKey,
        quantityByProductId,
        selection: {
          productId: "product-1",
          saleUnitId: "kg",
          variantId: "variant-1",
        },
      }),
    ).toBe(2);

    expect(
      shouldUseLineQuantity({ productId: "product-1" }, "line"),
    ).toBe(true);
  });
});
