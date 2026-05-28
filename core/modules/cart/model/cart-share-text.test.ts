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
    expect(text).toContain("Coffee - 3 Box, 12 - ~900 RUB~ 750 RUB");
    expect(text).toContain("Method: pickup");
    expect(text).toContain("call first");
    expect(text).toContain("900 RUB");
    expect(text).toContain("750 RUB");
    expect(text).not.toContain("SKU-1");
  });

  it("adds the selected variant to the product line", () => {
    const text = buildLegacyCartShareText({
      currency: "RUB",
      items: [
        cartItemView({
          displayLineTotal: 900,
          hasDiscount: false,
          name: "Vest (old suffix)",
          originalLineTotal: 900,
          saleUnitLabel: null,
          variantLabel: "XL / Khaki",
        }),
      ],
      totals: {
        originalSubtotal: 900,
        subtotal: 900,
      },
      url: "https://example.test/?c=abc",
    });

    expect(text).toContain("Vest (XL / Khaki) - 3 шт. - 900 RUB");
    expect(text).not.toContain("old suffix");
  });

  it("omits item price when line total is unknown", () => {
    const text = buildLegacyCartShareText({
      currency: "RUB",
      items: [
        cartItemView({
          displayLineTotal: null,
          originalLineTotal: null,
        }),
      ],
      totals: {
        originalSubtotal: 0,
        subtotal: 0,
      },
      url: "https://example.test/?c=abc",
    });

    expect(text).toContain("Coffee - 3 Box, 12");
    expect(text).not.toContain("Coffee - 3 Box, 12 - 0 RUB");
  });
});
