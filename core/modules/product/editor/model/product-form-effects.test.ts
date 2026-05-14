import {
  AttributeDtoDataType,
  type AttributeDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import {
  applyBooleanAttributeDefaults,
  clearAttributeValues,
  getDiscountedPriceAttributeIdToReset,
} from "./product-form-effects";

const NOW = "2026-05-13T00:00:00.000Z";

function attribute(overrides: Partial<AttributeDto> = {}): AttributeDto {
  return {
    id: "attribute-1",
    typeIds: [],
    key: "flag",
    displayName: "Flag",
    dataType: AttributeDtoDataType.BOOLEAN,
    isRequired: false,
    isVariantAttribute: false,
    isFilterable: false,
    displayOrder: 1,
    isHidden: false,
    createdAt: NOW,
    updatedAt: NOW,
    enumValues: [],
    ...overrides,
  };
}

describe("product form effects helpers", () => {
  it("applies boolean defaults without overwriting existing values", () => {
    const currentValues = {
      enabled: true,
      title: "Existing",
    };
    const result = applyBooleanAttributeDefaults(
      [
        attribute({ id: "enabled" }),
        attribute({ id: "visible" }),
        attribute({
          id: "title",
          dataType: AttributeDtoDataType.STRING,
        }),
      ],
      currentValues,
    );

    expect(result.changed).toBe(true);
    expect(result.values).toEqual({
      enabled: true,
      title: "Existing",
      visible: false,
    });
    expect(currentValues).toEqual({
      enabled: true,
      title: "Existing",
    });
  });

  it("returns the original attributes object when boolean defaults are unchanged", () => {
    const currentValues = {
      enabled: false,
    };
    const result = applyBooleanAttributeDefaults(
      [attribute({ id: "enabled" })],
      currentValues,
    );

    expect(result.changed).toBe(false);
    expect(result.values).toBe(currentValues);
  });

  it("clears requested attribute values to null", () => {
    const currentValues = {
      discount: "10",
      missing: undefined,
      title: "Product",
    } as unknown as Parameters<typeof clearAttributeValues>[1];
    const result = clearAttributeValues(["discount", "missing"], currentValues);

    expect(result.changed).toBe(true);
    expect(result.values).toEqual({
      discount: null,
      missing: null,
      title: "Product",
    });
  });

  it("does not change attributes that are already null", () => {
    const currentValues = {
      discount: null,
    };
    const result = clearAttributeValues(["discount"], currentValues);

    expect(result.changed).toBe(false);
    expect(result.values).toBe(currentValues);
  });

  it("returns discounted price attribute id only when it needs reset", () => {
    const discountedPrice = attribute({
      id: "discounted-price",
      key: "discountedprice",
      dataType: AttributeDtoDataType.DECIMAL,
    });

    expect(
      getDiscountedPriceAttributeIdToReset([discountedPrice], {
        "discounted-price": "100",
      }),
    ).toBe("discounted-price");
    expect(
      getDiscountedPriceAttributeIdToReset([discountedPrice], {
        "discounted-price": null,
      }),
    ).toBeNull();
    expect(getDiscountedPriceAttributeIdToReset([], {})).toBeNull();
  });
});
