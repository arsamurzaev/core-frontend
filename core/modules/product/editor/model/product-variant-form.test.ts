import { describe, expect, it } from "vitest";
import {
  createEmptyVariantsFormValue,
  nextVariantStatus,
  normalizeVariantsFormValue,
} from "./product-variant-form";

describe("product variant form model", () => {
  it("creates an empty variants form value", () => {
    expect(createEmptyVariantsFormValue()).toEqual({
      selectedAttributeIds: [],
      selectedValueIdsByAttributeId: {},
      combinations: {},
    });
  });

  it("normalizes current variant form values", () => {
    expect(
      normalizeVariantsFormValue({
        selectedAttributeIds: ["size", 12, "color"],
        selectedValueIdsByAttributeId: {
          size: ["s", null, "m"],
        },
        combinations: {
          "size=s": {
            price: 100,
            status: "ACTIVE",
            stock: "4.8",
            saleUnits: [],
          },
          "size=m": {
            status: "BROKEN",
            stock: -3,
          },
        },
      }),
    ).toEqual({
      selectedAttributeIds: ["size", "color"],
      selectedValueIdsByAttributeId: {
        size: ["s", "m"],
      },
      combinations: {
        "size=s": {
          price: "100",
          status: "ACTIVE",
          stock: 4,
          saleUnits: [],
        },
        "size=m": {
          status: "DISABLED",
          stock: 0,
          saleUnits: undefined,
        },
      },
    });
  });

  it("normalizes the legacy one-attribute variants shape", () => {
    expect(
      normalizeVariantsFormValue({
        size: {
          s: {
            price: "100",
            status: "ACTIVE",
            stock: 2,
          },
        },
      }),
    ).toEqual({
      selectedAttributeIds: ["size"],
      selectedValueIdsByAttributeId: {
        size: ["s"],
      },
      combinations: {
        "size=s": {
          price: "100",
          status: "ACTIVE",
          stock: 2,
          saleUnits: undefined,
        },
      },
    });
  });

  it("cycles statuses in the editor order", () => {
    expect(nextVariantStatus("DISABLED")).toBe("ACTIVE");
    expect(nextVariantStatus("ACTIVE")).toBe("OUT_OF_STOCK");
    expect(nextVariantStatus("OUT_OF_STOCK")).toBe("DISABLED");
  });
});
