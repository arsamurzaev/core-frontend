import { describe, expect, it } from "vitest";
import {
  isProductVariantSelectable,
  resolveProductVariantAvailability,
} from "./product-variant-availability";

describe("product variant availability", () => {
  it("treats null stock as selectable when stock is enforced", () => {
    expect(
      resolveProductVariantAvailability({
        isAvailable: true,
        status: "ACTIVE",
        stock: null,
      }),
    ).toEqual({
      isSelectable: true,
      label: null,
      reason: null,
    });
  });

  it("blocks zero stock only while stock is enforced", () => {
    const variant = {
      isAvailable: true,
      status: "ACTIVE",
      stock: 0,
    };

    expect(resolveProductVariantAvailability(variant)).toMatchObject({
      isSelectable: false,
      reason: "out_of_stock",
    });
    expect(
      resolveProductVariantAvailability(variant, {
        shouldEnforceStock: false,
      }).isSelectable,
    ).toBe(true);
  });

  it("always blocks disabled variants", () => {
    expect(
      isProductVariantSelectable(
        {
          isAvailable: true,
          status: "DISABLED",
          stock: null,
        },
        { shouldEnforceStock: false },
      ),
    ).toBe(false);
  });
});
