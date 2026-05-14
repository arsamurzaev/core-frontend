import { describe, expect, it } from "vitest";
import {
  clearSaleUnitDraftNameAtIndex,
  formatSaleUnitQuantity,
  normalizeSaleUnitRows,
  removeSaleUnitDraftNameAtIndex,
  resolveSaleUnitDiscountPreview,
  toPositiveSaleUnitNumber,
} from "./product-sale-units-field-model";

describe("product sale units field model", () => {
  it("keeps exactly one default sale unit row", () => {
    expect(
      normalizeSaleUnitRows([
        {
          label: "Box",
          baseQuantity: "12",
          price: "1200",
          isDefault: false,
        },
        {
          label: "Pallet",
          baseQuantity: "48",
          price: "4000",
          isDefault: false,
        },
      ]),
    ).toMatchObject([{ isDefault: true }, { isDefault: false }]);

    expect(
      normalizeSaleUnitRows([
        {
          label: "Box",
          baseQuantity: "12",
          price: "1200",
          isDefault: true,
        },
        {
          label: "Pallet",
          baseQuantity: "48",
          price: "4000",
          isDefault: true,
        },
      ]),
    ).toMatchObject([{ isDefault: true }, { isDefault: false }]);
  });

  it("formats positive quantities and falls back to one", () => {
    expect(toPositiveSaleUnitNumber("2.5")).toBe(2.5);
    expect(toPositiveSaleUnitNumber("0")).toBeNull();
    expect(formatSaleUnitQuantity(null)).toBe("1");
    expect(formatSaleUnitQuantity("12")).toBe("12");
  });

  it("resolves discount preview from a valid sale unit price", () => {
    expect(resolveSaleUnitDiscountPreview("1000", 12.5)).toEqual({
      basePrice: 1000,
      finalPrice: 875,
    });
    expect(resolveSaleUnitDiscountPreview("", 12.5)).toBeNull();
    expect(resolveSaleUnitDiscountPreview("1000", 0)).toBeNull();
  });

  it("keeps draft names aligned when a row is removed", () => {
    expect(
      removeSaleUnitDraftNameAtIndex(
        {
          0: "Box",
          1: "Pallet",
          2: "Crate",
        },
        1,
      ),
    ).toEqual({
      0: "Box",
      1: "Crate",
    });

    expect(clearSaleUnitDraftNameAtIndex({ 0: "Box", 1: "Pallet" }, 0)).toEqual(
      { 1: "Pallet" },
    );
  });
});
