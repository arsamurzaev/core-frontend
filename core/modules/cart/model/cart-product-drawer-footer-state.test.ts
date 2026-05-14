import { describe, expect, it } from "vitest";
import {
  CART_PRODUCT_DRAWER_FOOTER_LABELS,
  getCartProductDrawerAddLabel,
  shouldShowCartProductDrawerAddButton,
} from "./cart-product-drawer-footer-state";

describe("shouldShowCartProductDrawerAddButton", () => {
  it("shows add button before a line has quantity", () => {
    expect(shouldShowCartProductDrawerAddButton(0)).toBe(true);
    expect(shouldShowCartProductDrawerAddButton(-1)).toBe(true);
    expect(shouldShowCartProductDrawerAddButton(1)).toBe(false);
  });
});

describe("getCartProductDrawerAddLabel", () => {
  it("uses disabled label when a valid variant is required", () => {
    expect(getCartProductDrawerAddLabel(true)).toBe(
      CART_PRODUCT_DRAWER_FOOTER_LABELS.selectAvailableVariant,
    );
    expect(getCartProductDrawerAddLabel(false)).toBe(
      CART_PRODUCT_DRAWER_FOOTER_LABELS.addToCart,
    );
  });
});
