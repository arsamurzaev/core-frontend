import { describe, expect, it } from "vitest";
import {
  CART_PRODUCT_CONTROL_MESSAGES,
  getCartProductControlErrorMessage,
  isCartIncrementDisabled,
  isVariantSelectionRequiredMessage,
  normalizeCartMaxQuantity,
  shouldConfirmCartLineRemoval,
  shouldRequireCartProductVariantSelection,
} from "./cart-product-controls";

describe("normalizeCartMaxQuantity", () => {
  it("keeps finite values and clamps negative values to zero", () => {
    expect(normalizeCartMaxQuantity(5)).toBe(5);
    expect(normalizeCartMaxQuantity(-2)).toBe(0);
  });

  it("ignores invalid values", () => {
    expect(normalizeCartMaxQuantity(undefined)).toBeUndefined();
    expect(normalizeCartMaxQuantity(Number.NaN)).toBeUndefined();
    expect(normalizeCartMaxQuantity(Number.POSITIVE_INFINITY)).toBeUndefined();
  });
});

describe("isCartIncrementDisabled", () => {
  it("disables increment only when normalized max quantity is reached", () => {
    expect(isCartIncrementDisabled({ maxQuantity: 3, quantity: 2 })).toBe(false);
    expect(isCartIncrementDisabled({ maxQuantity: 3, quantity: 3 })).toBe(true);
    expect(isCartIncrementDisabled({ quantity: 99 })).toBe(false);
  });
});

describe("shouldConfirmCartLineRemoval", () => {
  it("asks for confirmation only before removing the last line unit", () => {
    expect(shouldConfirmCartLineRemoval(0)).toBe(false);
    expect(shouldConfirmCartLineRemoval(1)).toBe(true);
    expect(shouldConfirmCartLineRemoval(2)).toBe(false);
  });
});

describe("shouldRequireCartProductVariantSelection", () => {
  const variantProduct = {
    productType: { code: "size", id: "type-1", name: "Size" },
    variantSummary: {
      activeCount: 3,
      maxPrice: "3000",
      minPrice: "1000",
      singleVariantId: null,
      totalStock: 10,
    },
  };

  it("requires a variant before cart mutation for a multi-variant product", () => {
    expect(
      shouldRequireCartProductVariantSelection({
        canUseProductVariants: true,
        product: variantProduct,
      }),
    ).toBe(true);
  });

  it("does not require selection when a concrete variant is already selected", () => {
    expect(
      shouldRequireCartProductVariantSelection({
        canUseProductVariants: true,
        product: variantProduct,
        variantId: "variant-1",
      }),
    ).toBe(false);
  });

  it("uses a single concrete variant without asking the user", () => {
    expect(
      shouldRequireCartProductVariantSelection({
        canUseProductVariants: true,
        product: {
          ...variantProduct,
          variantSummary: {
            ...variantProduct.variantSummary,
            activeCount: 1,
            singleVariantId: "variant-1",
          },
        },
      }),
    ).toBe(false);
  });

  it("respects an explicit selection requirement from the caller", () => {
    expect(
      shouldRequireCartProductVariantSelection({
        requiresVariantSelection: true,
      }),
    ).toBe(true);
  });

  it("does not infer variants when the feature is explicitly unavailable", () => {
    expect(
      shouldRequireCartProductVariantSelection({
        canUseProductVariants: false,
        product: variantProduct,
      }),
    ).toBe(false);
  });
});

describe("isVariantSelectionRequiredMessage", () => {
  it("detects backend variant-selection errors", () => {
    expect(
      isVariantSelectionRequiredMessage(
        `400: ${CART_PRODUCT_CONTROL_MESSAGES.variantSelectionRequired}`,
      ),
    ).toBe(true);
    expect(isVariantSelectionRequiredMessage("Another error")).toBe(false);
  });
});

describe("getCartProductControlErrorMessage", () => {
  it("prefers an explicit error message", () => {
    expect(getCartProductControlErrorMessage(new Error("Boom"))).toBe("Boom");
  });
});
