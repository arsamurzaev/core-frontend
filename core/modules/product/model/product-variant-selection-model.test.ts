import { describe, expect, it } from "vitest";
import {
  findKnownProductVariantOption,
  normalizeProductVariantId,
  resolveInitialProductVariantId,
  resolveProductVariantSelection,
} from "./product-variant-selection-model";

const variants = [
  {
    id: "available",
    isAvailable: true,
    status: "ACTIVE",
    stock: 3,
  },
  {
    id: "empty",
    isAvailable: false,
    status: "OUT_OF_STOCK",
    stock: 0,
  },
  {
    id: "disabled",
    isAvailable: true,
    status: "DISABLED",
    stock: null,
  },
];

describe("product variant selection model", () => {
  it("normalizes empty variant ids", () => {
    expect(normalizeProductVariantId(" variant-1 ")).toBe("variant-1");
    expect(normalizeProductVariantId(" ")).toBeNull();
    expect(normalizeProductVariantId(null)).toBeNull();
  });

  it("finds known variant options by normalized id", () => {
    expect(findKnownProductVariantOption(variants, " available ")?.id).toBe(
      "available",
    );
    expect(findKnownProductVariantOption(variants, "missing")).toBeNull();
  });

  it("keeps an explicit initial variant even if it is currently unavailable", () => {
    expect(
      resolveInitialProductVariantId({
        initialVariantId: "empty",
        variants,
      }),
    ).toBe("empty");
  });

  it("uses query/single/first only when selectable", () => {
    expect(
      resolveInitialProductVariantId({
        queryVariantId: "empty",
        singleVariantId: "disabled",
        variants,
      }),
    ).toBe("available");
  });

  it("can skip first selectable fallback for explicit user selection flows", () => {
    expect(
      resolveInitialProductVariantId({
        queryVariantId: "empty",
        shouldSelectFirstVariant: false,
        variants,
      }),
    ).toBeNull();
  });

  it("allows zero stock selection when stock is not enforced", () => {
    expect(
      resolveInitialProductVariantId({
        queryVariantId: "empty",
        shouldEnforceStock: false,
        variants,
      }),
    ).toBe("empty");
  });

  it("returns selected variant availability with the selected variant", () => {
    expect(
      resolveProductVariantSelection({
        selectedVariantId: "empty",
        variants,
      }),
    ).toMatchObject({
      isSelectedVariantSelectable: false,
      selectedVariant: { id: "empty" },
      selectedVariantAvailability: {
        isSelectable: false,
        reason: "out_of_stock",
      },
      selectedVariantId: "empty",
    });
  });
});
