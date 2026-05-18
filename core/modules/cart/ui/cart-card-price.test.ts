import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CartCardPrice, getCartCardDiscountPercent } from "./cart-card-price";

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

describe("CartCardPrice", () => {
  it("renders unknown price as a question mark without currency", () => {
    const html = renderToStaticMarkup(
      React.createElement(CartCardPrice, {
        item: item({
          displayLineTotal: null,
          hasDiscount: false,
          originalLineTotal: null,
        }),
        priceFormatMode: "integer",
      }),
    );

    expect(html).toContain("?");
    expect(html).not.toContain("RUB");
  });

  it("renders zero as a known price with currency", () => {
    const html = renderToStaticMarkup(
      React.createElement(CartCardPrice, {
        item: item({
          displayLineTotal: 0,
          hasDiscount: false,
          originalLineTotal: 0,
        }),
        priceFormatMode: "integer",
      }),
    );

    expect(html).toContain(">0 RUB<");
  });
});
