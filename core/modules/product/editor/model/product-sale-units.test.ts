import { describe, expect, it } from "vitest";
import {
  buildSaleUnitsFormValueFromUnknown,
  createDefaultSaleUnitFormValue,
  normalizeSaleUnitsForPayload,
  validateSaleUnitListForSubmit,
} from "./product-sale-units";

describe("product sale unit helpers", () => {
  it("creates an empty draft with default base quantity", () => {
    expect(createDefaultSaleUnitFormValue("120")).toEqual({
      catalogSaleUnitId: undefined,
      catalogSaleUnitName: undefined,
      label: "",
      baseQuantity: "1",
      price: "120",
      isDefault: true,
    });
  });

  it("normalizes payloads and keeps only one default unit", () => {
    expect(
      normalizeSaleUnitsForPayload([
        {
          catalogSaleUnitId: "box",
          catalogSaleUnitName: "Box",
          label: "",
          baseQuantity: "12",
          price: "1000",
          isDefault: false,
        },
        {
          catalogSaleUnitId: "",
          catalogSaleUnitName: "",
          label: "Piece",
          baseQuantity: "0",
          price: "-10",
          isDefault: false,
        },
      ]),
    ).toEqual([
      {
        catalogSaleUnitId: "box",
        baseQuantity: 12,
        price: 1000,
        isDefault: true,
      },
      {
        name: "Piece",
        baseQuantity: 0.0001,
        price: 0,
        isDefault: false,
      },
    ]);
  });

  it("ignores incomplete drafts when building payloads", () => {
    expect(
      normalizeSaleUnitsForPayload([
        {
          catalogSaleUnitId: "",
          catalogSaleUnitName: "",
          label: "",
          baseQuantity: "1",
          price: "",
          isDefault: true,
        },
      ]),
    ).toEqual([]);
  });

  it("validates duplicate catalog unit selections", () => {
    const issue = validateSaleUnitListForSubmit(
      [
        {
          catalogSaleUnitId: "box",
          catalogSaleUnitName: "Box",
          label: "Box",
          baseQuantity: "12",
          price: "1000",
          isDefault: true,
        },
        {
          catalogSaleUnitId: "box",
          catalogSaleUnitName: "Box",
          label: "Box",
          baseQuantity: "24",
          price: "1900",
          isDefault: false,
        },
      ],
      "Единицы продажи",
    );

    expect(issue?.message).toContain("нельзя добавить дважды");
  });

  it("builds form values from backend-like sale units", () => {
    expect(
      buildSaleUnitsFormValueFromUnknown([
        {
          id: "variant-sale-unit-1",
          catalogSaleUnitId: "catalog-unit-1",
          catalogSaleUnit: {
            name: "Коробка",
            defaultBaseQuantity: 12,
          },
          price: "1500",
          isDefault: true,
        },
        {
          name: "Палета",
          quantity: "48",
          price: 5000,
        },
        {
          name: "Broken",
          price: null,
        },
      ]),
    ).toEqual([
      {
        id: "variant-sale-unit-1",
        catalogSaleUnitId: "catalog-unit-1",
        catalogSaleUnitName: "Коробка",
        label: "Коробка",
        baseQuantity: "12",
        price: "1500",
        isDefault: true,
      },
      {
        id: undefined,
        catalogSaleUnitId: undefined,
        catalogSaleUnitName: undefined,
        label: "Палета",
        baseQuantity: "48",
        price: "5000",
        isDefault: false,
      },
    ]);
  });
});
