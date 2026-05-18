import {
  AttributeDtoDataType,
  type AttributeDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { CREATE_PRODUCT_FORM_DEFAULT_VALUES } from "./form-config";
import { buildProductEditorBasePayloadFields } from "./product-editor-payload";

const NOW = "2026-05-17T00:00:00.000Z";

function attribute(overrides: Partial<AttributeDto> = {}): AttributeDto {
  return {
    id: "subtitle",
    typeIds: [],
    key: "subtitle",
    displayName: "Subtitle",
    dataType: AttributeDtoDataType.STRING,
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

describe("buildProductEditorBasePayloadFields", () => {
  it("normalizes shared create/edit product payload fields", () => {
    expect(
      buildProductEditorBasePayloadFields({
        formValues: {
          ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
          attributes: {
            subtitle: "Fresh",
          },
          brandId: " brand-1 ",
          categoryIds: [" category-1 ", "", "category-2"],
          name: " Product ",
          price: "1200",
          productTypeId: " type-1 ",
        },
        productAttributes: [attribute()],
      }),
    ).toEqual({
      attributes: [{ attributeId: "subtitle", valueString: "Fresh" }],
      brandId: "brand-1",
      categories: ["category-1", "category-2"],
      name: "Product",
      price: 1200,
      productTypeId: "type-1",
    });
  });

  it("keeps empty optional fields as null or empty collections", () => {
    expect(
      buildProductEditorBasePayloadFields({
        formValues: CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        productAttributes: [],
      }),
    ).toMatchObject({
      attributes: [],
      brandId: null,
      categories: [],
      name: "",
      price: null,
      productTypeId: null,
    });
  });
});
