import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import { describe, expect, it } from "vitest";
import { getCartCardDiscountPercent } from "./cart-card-price";

function item(overrides: Partial<CartItemView> = {}): CartItemView {
  return {
    currency: "RUB",
    displayLineTotal: 800,
    hasDiscount: true,
    id: "item-1",
    imageUrl: "/not-found-photo.png",
    name: "Coffee",
    originalLineTotal: 1000,
    product: undefined,
    productId: "product-1",
    productSlug: "coffee",
    quantity: 2,
    saleUnitId: null,
    saleUnitLabel: null,
    subtitle: "",
    variantId: null,
    variantLabel: null,
    ...overrides,
  };
}

describe("getCartCardDiscountPercent", () => {
  it("returns rounded discount percent", () => {
    expect(getCartCardDiscountPercent(item())).toBe(20);
  });

  it("keeps a visible minimum for a positive tiny discount", () => {
    expect(
      getCartCardDiscountPercent(
        item({
          displayLineTotal: 999,
          originalLineTotal: 1000,
        }),
      ),
    ).toBe(1);
  });

  it("does not show invalid or non-positive discounts", () => {
    expect(
      getCartCardDiscountPercent(
        item({
          displayLineTotal: 1000,
          originalLineTotal: 1000,
        }),
      ),
    ).toBe(0);
    expect(
      getCartCardDiscountPercent(
        item({
          displayLineTotal: 1000,
          originalLineTotal: 900,
        }),
      ),
    ).toBe(0);
    expect(
      getCartCardDiscountPercent(
        item({
          displayLineTotal: null,
          originalLineTotal: 1000,
        }),
      ),
    ).toBe(0);
    expect(
      getCartCardDiscountPercent(
        item({
          displayLineTotal: Number.NaN,
          originalLineTotal: 1000,
        }),
      ),
    ).toBe(0);
  });
});
