import { describe, expect, it } from "vitest";
import {
  applySaleUnitRelationQuantities,
  clearSaleUnitDraftNameAtIndex,
  clearSaleUnitRelationAtIndex,
  deriveSaleUnitRelationDrafts,
  formatSaleUnitQuantity,
  normalizeSaleUnitRows,
  removeSaleUnitDraftNameAtIndex,
  removeSaleUnitRelationAtIndex,
  resetSaleUnitRelationQuantity,
  resolveSaleUnitRelationDraft,
  resolveSaleUnitRelationBaseQuantity,
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
    expect(toPositiveSaleUnitNumber("2,5")).toBe(2.5);
    expect(toPositiveSaleUnitNumber("0")).toBeNull();
    expect(formatSaleUnitQuantity(null)).toBe("1");
    expect(formatSaleUnitQuantity("12")).toBe("12");
  });

  it("calculates local relations between sale units", () => {
    expect(resolveSaleUnitRelationBaseQuantity("4", "12")).toBe("48");
    expect(resolveSaleUnitRelationBaseQuantity("1", "12")).toBeNull();
    expect(resolveSaleUnitRelationBaseQuantity("4", "")).toBeNull();

    expect(
      applySaleUnitRelationQuantities(
        [
          {
            label: "Piece",
            baseQuantity: "1",
            price: "100",
            isDefault: true,
          },
          {
            label: "Box",
            baseQuantity: "1",
            price: "1000",
            isDefault: false,
          },
          {
            label: "Pallet",
            baseQuantity: "1",
            price: "4000",
            isDefault: false,
          },
        ],
        {
          1: { parentIndex: 0, multiplier: "12" },
          2: { parentIndex: 1, multiplier: "4" },
        },
      ).map((unit) => unit.baseQuantity),
    ).toEqual(["1", "12", "48"]);
  });

  it("ignores one-to-one contains relations", () => {
    expect(
      applySaleUnitRelationQuantities(
        [
          {
            label: "Pack 4",
            baseQuantity: "4",
            price: "540",
            isDefault: true,
          },
          {
            label: "Pack 6",
            baseQuantity: "6",
            price: "750",
            isDefault: false,
          },
        ],
        {
          1: { parentIndex: 0, multiplier: "1" },
        },
      ).map((unit) => unit.baseQuantity),
    ).toEqual(["4", "6"]);
  });

  it("derives relation drafts from saved absolute quantities", () => {
    expect(
      deriveSaleUnitRelationDrafts([
        {
          label: "шт.",
          baseQuantity: "1",
          price: "100",
          isDefault: true,
        },
        {
          label: "уп.",
          baseQuantity: "12",
          price: "2000",
          isDefault: false,
        },
        {
          label: "ящ.",
          baseQuantity: "48",
          price: "9000",
          isDefault: false,
        },
        {
          label: "пт.",
          baseQuantity: "480",
          price: "80000",
          isDefault: false,
        },
      ]),
    ).toEqual({
      1: { multiplier: "12", parentIndex: 0 },
      2: { multiplier: "4", parentIndex: 1 },
      3: { multiplier: "10", parentIndex: 2 },
    });
  });

  it("does not derive contains relations for independent non-multiple packages", () => {
    expect(
      deriveSaleUnitRelationDrafts([
        {
          label: "Pack 4",
          baseQuantity: "4",
          price: "540",
          isDefault: true,
        },
        {
          label: "Pack 6",
          baseQuantity: "6",
          price: "750",
          isDefault: false,
        },
      ]),
    ).toEqual({});
  });

  it("derives saved relation only when quantity differs from catalog default", () => {
    expect(
      deriveSaleUnitRelationDrafts(
        [
          {
            label: "Piece",
            baseQuantity: "1",
            catalogDefaultBaseQuantity: "1",
            price: "6000",
            isDefault: true,
          },
          {
            label: "Pack",
            baseQuantity: "4",
            catalogDefaultBaseQuantity: "4",
            price: "12000",
            isDefault: false,
          },
        ],
        { onlyChangedFromCatalogDefault: true },
      ),
    ).toEqual({});

    expect(
      deriveSaleUnitRelationDrafts(
        [
          {
            label: "Piece",
            baseQuantity: "1",
            catalogDefaultBaseQuantity: "1",
            price: "6000",
            isDefault: true,
          },
          {
            label: "Pack",
            baseQuantity: "2",
            catalogDefaultBaseQuantity: "4",
            price: "12000",
            isDefault: false,
          },
        ],
        { onlyChangedFromCatalogDefault: true },
      ),
    ).toEqual({
      1: { multiplier: "2", parentIndex: 0 },
    });
  });

  it("resets relation quantity back to catalog default when relation is cleared", () => {
    expect(
      resetSaleUnitRelationQuantity({
        label: "Pack",
        baseQuantity: "2",
        catalogDefaultBaseQuantity: "4",
        price: "1400",
        isDefault: false,
      }),
    ).toMatchObject({
      baseQuantity: "4",
    });
  });

  it("fills missing relation parent from derived saved relation", () => {
    expect(
      resolveSaleUnitRelationDraft(
        { multiplier: "4", parentIndex: null },
        { multiplier: "4", parentIndex: 1 },
      ),
    ).toEqual({ multiplier: "4", parentIndex: 1 });

    expect(
      resolveSaleUnitRelationDraft(
        { multiplier: "", parentIndex: null },
        { multiplier: "4", parentIndex: 1 },
      ),
    ).toEqual({ multiplier: "", parentIndex: null });

    expect(
      resolveSaleUnitRelationDraft(
        { multiplier: "", parentIndex: 1 },
        { multiplier: "4", parentIndex: 1 },
      ),
    ).toEqual({ multiplier: "", parentIndex: 1 });
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

  it("keeps relation drafts aligned when a row is removed", () => {
    expect(
      removeSaleUnitRelationAtIndex(
        {
          1: { parentIndex: 0, multiplier: "12" },
          2: { parentIndex: 1, multiplier: "4" },
        },
        0,
      ),
    ).toEqual({
      1: { parentIndex: 0, multiplier: "4" },
    });

    expect(
      removeSaleUnitRelationAtIndex(
        {
          1: { parentIndex: 0, multiplier: "12" },
          2: { parentIndex: 1, multiplier: "4" },
          3: { parentIndex: 1, multiplier: "8" },
        },
        2,
      ),
    ).toEqual({
      1: { parentIndex: 0, multiplier: "12" },
      2: { parentIndex: 1, multiplier: "8" },
    });

    expect(
      clearSaleUnitRelationAtIndex(
        {
          1: { parentIndex: 0, multiplier: "12" },
          2: { parentIndex: 1, multiplier: "4" },
        },
        1,
      ),
    ).toEqual({
      2: { parentIndex: 1, multiplier: "4" },
    });
  });
});
