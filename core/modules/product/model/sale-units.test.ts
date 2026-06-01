import { describe, expect, it } from "vitest";
import {
  formatProductSaleUnitQuantity,
  getProductSaleUnitContainsText,
  getProductSaleUnits,
} from "./sale-units";

describe("product sale units", () => {
  it("derives contains text from local sale unit order and quantities", () => {
    const units = getProductSaleUnits({
      saleUnits: [
        {
          id: "piece",
          name: "шт.",
          price: "100",
          baseQuantity: "1",
          displayOrder: 0,
        },
        {
          id: "pack",
          name: "уп.",
          price: "2000",
          baseQuantity: "12",
          displayOrder: 1,
        },
        {
          id: "box",
          name: "ящ.",
          price: "9000",
          baseQuantity: "48",
          displayOrder: 2,
        },
        {
          id: "pallet",
          name: "пт.",
          price: "80000",
          baseQuantity: "480",
          displayOrder: 3,
        },
      ],
    });

    expect(units.map(getProductSaleUnitContainsText)).toEqual([
      null,
      "Внутри: 12 шт.",
      "Внутри: 4 уп.",
      "Внутри: 10 ящ.",
    ]);
  });

  it("formats fractional local sale unit quantities without trailing zeros", () => {
    expect(formatProductSaleUnitQuantity(1.25)).toBe("1.25");
    expect(formatProductSaleUnitQuantity(2.5)).toBe("2.5");
    expect(formatProductSaleUnitQuantity(4)).toBe("4");
  });

  it("does not present independent package sizes as containing each other", () => {
    const units = getProductSaleUnits({
      saleUnits: [
        {
          id: "pack-4",
          name: "Pack 4",
          price: "540",
          baseQuantity: "4",
          displayOrder: 0,
        },
        {
          id: "pack-6",
          name: "Pack 6",
          price: "750",
          baseQuantity: "6",
          displayOrder: 1,
        },
      ],
    });

    expect(units.map(getProductSaleUnitContainsText)).toEqual([null, null]);
  });
});
