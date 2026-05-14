import {
  AttributeDtoDataType,
  AttributeEnumValueDtoSource,
  type AttributeDto,
  type AttributeEnumValueDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { buildVariantCombinationKey } from "./product-variants";
import {
  compactVariantsForAttributes,
  getEnumValueLabel,
  preserveMatchingCombinations,
  resolveVariantDiscountPreview,
} from "./product-variants-field-model";

function attribute(overrides: Partial<AttributeDto> = {}): AttributeDto {
  return {
    id: "attribute-1",
    typeIds: [],
    key: "size",
    displayName: "Size",
    dataType: AttributeDtoDataType.ENUM,
    isRequired: false,
    isVariantAttribute: true,
    isFilterable: false,
    displayOrder: 1,
    isHidden: false,
    createdAt: "2026-05-13T00:00:00.000Z",
    updatedAt: "2026-05-13T00:00:00.000Z",
    enumValues: [],
    ...overrides,
  };
}

function enumValue(
  overrides: Partial<AttributeEnumValueDto> = {},
): AttributeEnumValueDto {
  return {
    id: "s",
    attributeId: "attribute-1",
    catalogId: null,
    value: "s",
    displayName: "Small",
    displayOrder: 1,
    businessId: null,
    source: AttributeEnumValueDtoSource.MANUAL,
    mergedIntoId: null,
    aliases: [],
    createdAt: "2026-05-13T00:00:00.000Z",
    updatedAt: "2026-05-13T00:00:00.000Z",
    ...overrides,
  };
}

describe("product variants field model", () => {
  it("compacts selected attributes and enum values against current attributes", () => {
    const size = attribute({
      id: "size",
      enumValues: [
        enumValue({
          id: "s",
          attributeId: "size",
          value: "s",
          displayName: "Small",
        }),
      ],
    });

    expect(
      compactVariantsForAttributes(
        {
          selectedAttributeIds: ["size", "missing"],
          selectedValueIdsByAttributeId: {
            size: ["s", "xl"],
            missing: ["ghost"],
          },
          combinations: {
            stale: {
              status: "ACTIVE",
              stock: 1,
            },
          },
        },
        [size],
      ),
    ).toEqual({
      selectedAttributeIds: ["size"],
      selectedValueIdsByAttributeId: {
        size: ["s"],
      },
      combinations: {
        stale: {
          status: "ACTIVE",
          stock: 1,
        },
      },
    });
  });

  it("preserves matching combination data when an attribute is removed", () => {
    const size = attribute({ id: "size", displayName: "Size" });
    const color = attribute({ id: "color", displayName: "Color" });
    const sizeColorKey = buildVariantCombinationKey(
      [
        { attributeId: "size", enumValueId: "m" },
        { attributeId: "color", enumValueId: "red" },
      ],
      [size, color],
    );
    const sizeOnlyKey = buildVariantCombinationKey(
      [{ attributeId: "size", enumValueId: "m" }],
      [size, color],
    );

    expect(
      preserveMatchingCombinations(
        {
          selectedAttributeIds: ["size", "color"],
          selectedValueIdsByAttributeId: {
            size: ["m"],
            color: ["red"],
          },
          combinations: {
            [sizeColorKey]: {
              price: "1200",
              status: "ACTIVE",
              stock: 4,
            },
          },
        },
        ["size"],
        [size, color],
      )[sizeOnlyKey],
    ).toEqual({
      price: "1200",
      status: "ACTIVE",
      stock: 4,
    });
  });

  it("resolves labels and discount previews", () => {
    const size = attribute({
      enumValues: [
        enumValue({
          id: "m",
          attributeId: "attribute-1",
          value: "medium",
          displayName: "Medium",
        }),
      ],
    });

    expect(getEnumValueLabel(size, "m")).toBe("Medium");
    expect(getEnumValueLabel(size, "missing")).toBe("missing");
    expect(resolveVariantDiscountPreview("2000", 15)).toEqual({
      basePrice: 2000,
      finalPrice: 1700,
    });
  });
});
