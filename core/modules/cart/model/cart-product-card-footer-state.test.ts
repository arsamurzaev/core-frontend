import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import { describe, expect, it } from "vitest";
import {
  buildCartLineSnapshot,
  canShowCartProductFooterPrice,
  getCartProductLinesSummary,
  pluralizeRu,
} from "./cart-product-card-footer-state";

const VARIANT_FORMS = ["variant", "variants", "variants"] as const;

function cartLine(overrides: Partial<CartItemView> = {}): CartItemView {
  return {
    currency: "RUB",
    displayLineTotal: 240,
    hasDiscount: false,
    id: "item-1",
    imageUrl: "/not-found-photo.png",
    name: "Coffee",
    originalLineTotal: 240,
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

describe("pluralizeRu", () => {
  it("uses Russian pluralization rules", () => {
    expect(pluralizeRu(1, VARIANT_FORMS)).toBe("variant");
    expect(pluralizeRu(2, VARIANT_FORMS)).toBe("variants");
    expect(pluralizeRu(5, VARIANT_FORMS)).toBe("variants");
    expect(pluralizeRu(11, VARIANT_FORMS)).toBe("variants");
    expect(pluralizeRu(21, VARIANT_FORMS)).toBe("variant");
  });
});

describe("buildCartLineSnapshot", () => {
  it("uses the cart line unit price when quantity is positive", () => {
    expect(
      buildCartLineSnapshot(
        {
          id: "product-1",
          name: "Coffee",
          price: "100",
          slug: "coffee",
        },
        cartLine({
          displayLineTotal: 240,
          quantity: 2,
        }),
      ),
    ).toEqual({
      id: "product-1",
      name: "Coffee",
      price: "120",
      slug: "coffee",
    });
  });

  it("falls back to the product price when quantity is zero", () => {
    expect(
      buildCartLineSnapshot(
        {
          id: "product-1",
          name: "Coffee",
          price: "100",
          slug: "coffee",
        },
        cartLine({
          displayLineTotal: 0,
          quantity: 0,
        }),
      ).price,
    ).toBe("100");
  });

  it("keeps the snapshot price empty when line and product prices are unknown", () => {
    expect(
      buildCartLineSnapshot(
        {
          id: "product-1",
          name: "Coffee",
          price: null,
          slug: "coffee",
        },
        cartLine({
          displayLineTotal: null,
          quantity: 2,
        }),
      ).price,
    ).toBeNull();
  });
});

describe("getCartProductLinesSummary", () => {
  it("summarizes quantity, price, currency and line count", () => {
    expect(
      getCartProductLinesSummary(
        [
          cartLine({ currency: "USD", displayLineTotal: 100, quantity: 1 }),
          cartLine({ currency: "USD", displayLineTotal: 250, quantity: 3 }),
        ],
        "RUB",
      ),
    ).toMatchObject({
      currency: "USD",
      linesCount: 2,
      totalPrice: 350,
      totalQuantity: 4,
    });
  });
});

describe("canShowCartProductFooterPrice", () => {
  it("keeps zero as a valid display price", () => {
    expect(canShowCartProductFooterPrice(0)).toBe(true);
    expect(canShowCartProductFooterPrice(null)).toBe(false);
    expect(canShowCartProductFooterPrice(Number.NaN)).toBe(false);
  });
});
