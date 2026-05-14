import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import { describe, expect, it } from "vitest";
import { buildLegacyCartShareText } from "./cart-share-text";

function cartItemView(overrides: Partial<CartItemView> = {}): CartItemView {
  return {
    id: "item-1",
    productId: "product-1",
    productSlug: "coffee",
    name: "Coffee",
    imageUrl: "/not-found-photo.png",
    quantity: 3,
    currency: "RUB",
    displayLineTotal: 750,
    originalLineTotal: 900,
    hasDiscount: true,
    saleUnitId: "box",
    saleUnitLabel: "Box, 12",
    subtitle: "Box, 12",
    variantId: null,
    variantLabel: null,
    ...overrides,
  };
}

describe("buildLegacyCartShareText", () => {
  it("includes sale unit quantity, checkout summary and trimmed comment", () => {
    const text = buildLegacyCartShareText({
      checkoutSummary: ["Method: pickup"],
      comment: "  call first  ",
      currency: "RUB",
      items: [cartItemView({ name: "Coffee (SKU-1)" })],
      totals: {
        originalSubtotal: 900,
        subtotal: 750,
      },
      url: "https://example.test/?c=abc",
    });

    expect(text).toContain("https://example.test/?c=abc");
    expect(text).toContain("Coffee - 3 Box, 12");
    expect(text).toContain("Method: pickup");
    expect(text).toContain("call first");
    expect(text).toContain("900 RUB");
    expect(text).toContain("750 RUB");
    expect(text).not.toContain("SKU-1");
  });
});
