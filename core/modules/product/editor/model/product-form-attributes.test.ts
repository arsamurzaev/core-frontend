import {
  AttributeDtoDataType,
  AttributeEnumValueDtoSource,
  type AttributeDto,
  type AttributeEnumValueDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import {
  getProductEditorProductAttributes,
  getProductEditorVariantAttributes,
  mergeProductEditorAttributes,
  resolveProductTypeAttributes,
  shouldResolveProductTypeAttributes,
} from "./product-form-attributes";

const NOW = "2026-05-13T00:00:00.000Z";

function enumValue(
  overrides: Partial<AttributeEnumValueDto> = {},
): AttributeEnumValueDto {
  return {
    id: "enum-1",
    attributeId: "attribute-1",
    catalogId: "catalog-1",
    value: "value",
    displayName: "Value",
    displayOrder: 1,
    businessId: null,
    source: AttributeEnumValueDtoSource.MANUAL,
    mergedIntoId: null,
    aliases: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function attribute(overrides: Partial<AttributeDto> = {}): AttributeDto {
  return {
    id: "attribute-1",
    typeIds: [],
    key: "color",
    displayName: "Color",
    dataType: AttributeDtoDataType.ENUM,
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

describe("product form attributes", () => {
  it("resolves product type attributes only for selected enabled types", () => {
    expect(
      shouldResolveProductTypeAttributes({
        canUseProductTypes: true,
        productTypeId: "type-1",
        useSelectedProductTypeSchema: true,
      }),
    ).toBe(true);
    expect(
      shouldResolveProductTypeAttributes({
        canUseProductTypes: true,
        productTypeId: null,
        useSelectedProductTypeSchema: true,
      }),
    ).toBe(false);
    expect(
      resolveProductTypeAttributes({
        matrixAttributes: [attribute()],
        shouldResolveFromProductType: false,
      }),
    ).toEqual([]);
  });

  it("merges source and product type attributes while preserving base enum values", () => {
    const sourceEnumValue = enumValue({
      id: "enum-source",
      value: "source",
    });
    const merged = mergeProductEditorAttributes({
      sourceAttributes: [
        attribute({
          id: "color",
          enumValues: [sourceEnumValue],
          isRequired: false,
        }),
      ],
      productTypeAttributes: [
        attribute({
          id: "color",
          enumValues: [],
          isRequired: true,
        }),
      ],
    });

    expect(merged).toHaveLength(1);
    expect(merged[0]?.isRequired).toBe(true);
    expect(merged[0]?.enumValues).toEqual([sourceEnumValue]);
  });

  it("splits product and variant attributes by visibility and enum support", () => {
    const attributes = [
      attribute({
        id: "product-name",
        dataType: AttributeDtoDataType.STRING,
        displayName: "Name",
        displayOrder: 2,
      }),
      attribute({
        id: "hidden",
        isHidden: true,
      }),
      attribute({
        id: "variant-color",
        isVariantAttribute: true,
      }),
      attribute({
        id: "variant-weight",
        dataType: AttributeDtoDataType.DECIMAL,
        isVariantAttribute: true,
      }),
    ];

    expect(getProductEditorProductAttributes(attributes).map((item) => item.id))
      .toEqual(["product-name"]);
    expect(
      getProductEditorVariantAttributes({
        canUseProductVariants: true,
        isMatrixSchemaError: false,
        productTypeAttributes: attributes,
        shouldResolveFromProductType: true,
      }).map((item) => item.id),
    ).toEqual(["variant-color"]);
  });
});
