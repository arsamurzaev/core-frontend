import { describe, expect, it } from "vitest";
import {
  CART_PRODUCT_ACTION_LABELS,
  canOpenCartProductVariantDrawer,
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

describe("canOpenCartProductVariantDrawer", () => {
  it("does not expose variant UI when the capability is disabled", () => {
    expect(
      canOpenCartProductVariantDrawer({
        activeVariantCount: 3,
        canUseProductVariants: false,
        hasVariantPickerOptions: true,
        requiresVariantSelection: true,
      }),
    ).toBe(false);
  });

  it("opens variant UI only for enabled catalogs with variant choices", () => {
    expect(
      canOpenCartProductVariantDrawer({
        activeVariantCount: 2,
        canUseProductVariants: true,
      }),
    ).toBe(true);
    expect(
      canOpenCartProductVariantDrawer({
        activeVariantCount: 1,
        canUseProductVariants: true,
        hasVariantPickerOptions: false,
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

  it("allows an open drawer for sale-unit selection without variant capability", () => {
    expect(
      shouldRenderCartProductVariantDrawer({
        canUseCatalogSaleUnits: true,
        canUseProductVariants: false,
        isVariantDrawerOpen: true,
        requiresVariantSelection: false,
      }),
    ).toBe(true);
  });

  it("allows sale-unit drawers to load detailed units when card data has none", () => {
    expect(
      shouldRenderCartProductVariantDrawer({
        canUseCatalogSaleUnits: true,
        canUseProductVariants: false,
        isVariantDrawerOpen: true,
        requiresVariantSelection: false,
      }),
    ).toBe(true);
  });

  it("does not render a sale-unit drawer when the sale-unit capability is disabled", () => {
    expect(
      shouldRenderCartProductVariantDrawer({
        canUseCatalogSaleUnits: false,
        canUseProductVariants: false,
        isVariantDrawerOpen: true,
        requiresVariantSelection: false,
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
