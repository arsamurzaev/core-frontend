import {
  AttributeDtoDataType,
  type AttributeDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import {
  filterVisibleDiscountAttributes,
  findProductAttributeByKey,
  getDiscountAttributeIds,
  getDiscountedPriceAttributeId,
  isDiscountAttribute,
  isSaleUnitPricingDraftTouched,
  normalizeProductAttributeKey,
  resolveDiscountPercent,
} from "./product-discount";

function attribute(overrides: Partial<AttributeDto> = {}): AttributeDto {
  return {
    id: "attribute-1",
    typeIds: [],
    key: "discount",
    displayName: "Discount",
    dataType: AttributeDtoDataType.DECIMAL,
    isRequired: false,
    isVariantAttribute: false,
    isFilterable: false,
    displayOrder: 1,
    isHidden: false,
    createdAt: "2026-05-13T00:00:00.000Z",
    updatedAt: "2026-05-13T00:00:00.000Z",
    enumValues: [],
    ...overrides,
  };
}

describe("product discount helpers", () => {
  it("normalizes attribute keys for generated and custom discount names", () => {
    expect(normalizeProductAttributeKey("discounted_price")).toBe(
      "discountedprice",
    );
    expect(isDiscountAttribute(attribute({ key: "discount-end-at" }))).toBe(
      true,
    );
  });

  it("finds attributes by normalized key", () => {
    const result = findProductAttributeByKey(
      [
        attribute({ id: "description", key: "description" }),
        attribute({ id: "discounted-price", key: "discounted_price" }),
      ],
      "discountedPrice",
    );

    expect(result?.id).toBe("discounted-price");
  });

  it("clamps resolved discount percent", () => {
    const discount = attribute({ id: "discount" });

    expect(
      resolveDiscountPercent([discount], {
        discount: "120.4",
      }),
    ).toBe(100);
    expect(
      resolveDiscountPercent([discount], {
        discount: "-5",
      }),
    ).toBe(0);
  });

  it("filters visible discount attributes based on discount mode", () => {
    const attributes = [
      attribute({ id: "name", key: "name" }),
      attribute({ id: "discount", key: "discount" }),
      attribute({ id: "discounted-price", key: "discounted_price" }),
    ];

    expect(getDiscountAttributeIds(attributes)).toEqual([
      "discount",
      "discounted-price",
    ]);
    expect(getDiscountedPriceAttributeId(attributes)).toBe("discounted-price");
    expect(
      filterVisibleDiscountAttributes(attributes, {
        hasDiscount: false,
        shouldUsePercentDiscountOnly: false,
      }).map((entry) => entry.id),
    ).toEqual(["name"]);
    expect(
      filterVisibleDiscountAttributes(attributes, {
        hasDiscount: true,
        shouldUsePercentDiscountOnly: true,
      }).map((entry) => entry.id),
    ).toEqual(["name", "discount"]);
  });

  it("detects sale unit pricing drafts without treating default base quantity as pricing", () => {
    expect(
      isSaleUnitPricingDraftTouched({
        baseQuantity: "1",
        label: "",
        price: "",
      }),
    ).toBe(false);
    expect(
      isSaleUnitPricingDraftTouched({
        baseQuantity: "1",
        label: "",
        price: "100",
      }),
    ).toBe(true);
  });
});
