import {
  AttributeDtoDataType,
  AttributeEnumValueDtoSource,
  type AttributeDto,
  type AttributeEnumValueDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import {
  buildVariantCombinationKey,
  buildVariantMatrixRows,
  hasEnabledVariantCombinations,
  parseVariantCombinationKey,
} from "./product-variant-matrix";

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
    id: "m",
    attributeId: "attribute-1",
    catalogId: null,
    value: "m",
    displayName: "Medium",
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

describe("product variant matrix model", () => {
  it("builds and parses ordered combination keys", () => {
    const size = attribute({ id: "size" });
    const color = attribute({ id: "color" });

    expect(
      buildVariantCombinationKey(
        [
          { attributeId: "size", enumValueId: "m" },
          { attributeId: "color", enumValueId: "red" },
        ],
        [color, size],
      ),
    ).toBe("color=red|size=m");

    expect(parseVariantCombinationKey("color=red|broken|size=m")).toEqual([
      { attributeId: "color", enumValueId: "red" },
      { attributeId: "size", enumValueId: "m" },
    ]);
  });

  it("builds rows only from allowed selected enum values", () => {
    const size = attribute({
      id: "size",
      displayName: "Size",
      enumValues: [
        enumValue({
          id: "m",
          attributeId: "size",
          value: "m",
          displayName: "Medium",
        }),
      ],
    });
    const color = attribute({
      id: "color",
      displayName: "Color",
      enumValues: [
        enumValue({
          id: "red",
          attributeId: "color",
          value: "red",
          displayName: "Red",
        }),
      ],
    });

    const rows = buildVariantMatrixRows(
      {
        selectedAttributeIds: ["size", "color"],
        selectedValueIdsByAttributeId: {
          size: ["m", "ghost"],
          color: ["red"],
        },
        combinations: {
          "color=red|size=m": {
            status: "ACTIVE",
            stock: 3,
          },
        },
      },
      [color, size],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      key: "color=red|size=m",
      label: "Red + Medium",
      item: {
        status: "ACTIVE",
        stock: 3,
      },
    });
    expect(hasEnabledVariantCombinations(rows[0] ? {
      selectedAttributeIds: ["size", "color"],
      selectedValueIdsByAttributeId: {
        size: ["m"],
        color: ["red"],
      },
      combinations: {
        [rows[0].key]: rows[0].item,
      },
    } : undefined, [color, size])).toBe(true);
  });
});
