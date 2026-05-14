import { describe, expect, it } from "vitest";
import {
  CART_PRODUCT_ACTION_LABELS,
  getCartProductActionAriaLabel,
  shouldRenderCartProductVariantDrawer,
  shouldShowCartProductActionQuantity,
} from "./cart-product-action-state";

describe("shouldShowCartProductActionQuantity", () => {
  it("shows quantity only for concrete selected products", () => {
    expect(
      shouldShowCartProductActionQuantity({
        quantity: 2,
        requiresVariantSelection: false,
      }),
    ).toBe(true);
    expect(
      shouldShowCartProductActionQuantity({
        quantity: 2,
        requiresVariantSelection: true,
      }),
    ).toBe(false);
    expect(
      shouldShowCartProductActionQuantity({
        quantity: 0,
        requiresVariantSelection: false,
      }),
    ).toBe(false);
  });
});

describe("shouldRenderCartProductVariantDrawer", () => {
  it("requires variant capability and either required selection or an open drawer", () => {
    expect(
      shouldRenderCartProductVariantDrawer({
        canUseProductVariants: true,
        isVariantDrawerOpen: false,
        requiresVariantSelection: true,
      }),
    ).toBe(true);
    expect(
      shouldRenderCartProductVariantDrawer({
        canUseProductVariants: true,
        isVariantDrawerOpen: true,
        requiresVariantSelection: false,
      }),
    ).toBe(true);
    expect(
      shouldRenderCartProductVariantDrawer({
        canUseProductVariants: false,
        isVariantDrawerOpen: true,
        requiresVariantSelection: true,
      }),
    ).toBe(false);
  });
});

describe("getCartProductActionAriaLabel", () => {
  it("prioritizes unavailable and variant selection labels", () => {
    expect(
      getCartProductActionAriaLabel({
        isUnavailable: true,
        quantity: 3,
        requiresVariantSelection: true,
        shouldShowQuantity: true,
      }),
    ).toBe(CART_PRODUCT_ACTION_LABELS.unavailable);
    expect(
      getCartProductActionAriaLabel({
        isUnavailable: false,
        quantity: 3,
        requiresVariantSelection: true,
        shouldShowQuantity: true,
      }),
    ).toBe(CART_PRODUCT_ACTION_LABELS.selectVariant);
  });

  it("uses quantity and add labels for regular products", () => {
    expect(
      getCartProductActionAriaLabel({
        isUnavailable: false,
        quantity: 3,
        requiresVariantSelection: false,
        shouldShowQuantity: true,
      }),
    ).toBe(`${CART_PRODUCT_ACTION_LABELS.cartQuantity}: 3`);
    expect(
      getCartProductActionAriaLabel({
        isUnavailable: false,
        quantity: 0,
        requiresVariantSelection: false,
        shouldShowQuantity: false,
      }),
    ).toBe(CART_PRODUCT_ACTION_LABELS.addToCart);
  });
});
