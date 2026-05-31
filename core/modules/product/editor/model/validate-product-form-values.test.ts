import {
  AttributeDtoDataType,
  AttributeEnumValueDtoSource,
  type AttributeDto,
  type AttributeEnumValueDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { CREATE_PRODUCT_FORM_DEFAULT_VALUES } from "./form-config";
import { validateProductFormValues } from "./validate-product-form-values";

const NOW = "2026-05-17T00:00:00.000Z";

function enumValue(
  overrides: Partial<AttributeEnumValueDto> = {},
): AttributeEnumValueDto {
  return {
    id: "size-m",
    attributeId: "size",
    catalogId: null,
    value: "m",
    displayName: "M",
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
    id: "size",
    typeIds: [],
    key: "size",
    displayName: "Size",
    dataType: AttributeDtoDataType.ENUM,
    isRequired: false,
    isVariantAttribute: true,
    isFilterable: false,
    displayOrder: 1,
    isHidden: false,
    createdAt: NOW,
    updatedAt: NOW,
    enumValues: [
      enumValue({
        id: "size-m",
        attributeId: "size",
      }),
    ],
    ...overrides,
  };
}

function validate(overrides: {
  canEditPrice?: boolean;
  canUseCatalogSaleUnits?: boolean;
  canUseProductVariants?: boolean;
  priceFormatMode?: "integer" | "decimal";
  values?: typeof CREATE_PRODUCT_FORM_DEFAULT_VALUES;
  variantAttributes?: AttributeDto[];
}) {
  return validateProductFormValues({
    invalidFormMessage: "invalid form",
    invalidPriceMessage: "invalid price",
    canEditPrice: overrides.canEditPrice,
    canUseCatalogSaleUnits: overrides.canUseCatalogSaleUnits,
    canUseProductVariants: overrides.canUseProductVariants,
    priceFormatMode: overrides.priceFormatMode,
    values: {
      ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
      name: "Box",
      price: "1000",
      ...overrides.values,
    },
    variantAttributes: overrides.variantAttributes,
    visibleAttributes: [],
  });
}

describe("validateProductFormValues", () => {
  it("ignores hidden variant matrix when product variants capability is disabled", () => {
    const result = validate({
      canUseProductVariants: false,
      variantAttributes: [attribute()],
      values: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Box",
        price: "1000",
        productTypeId: "type-1",
      },
    });

    expect(result.success).toBe(true);
  });

  it("ignores hidden variant prices when product variants capability is disabled", () => {
    const result = validate({
      canUseProductVariants: false,
      variantAttributes: [attribute()],
      values: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Box",
        price: "1000",
        productTypeId: "type-1",
        variants: {
          selectedAttributeIds: ["size"],
          selectedValueIdsByAttributeId: {
            size: ["size-m"],
          },
          combinations: {
            "size=size-m": {
              price: "-1",
              status: "ACTIVE",
              stock: null,
            },
          },
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it("requires enabled variant combinations when product variants capability is enabled", () => {
    const result = validate({
      canUseProductVariants: true,
      variantAttributes: [attribute()],
      values: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Box",
        price: "1000",
        productTypeId: "type-1",
      },
    });

    expect(result).toMatchObject({
      success: false,
    });
  });

  it("validates variant prices when product variants capability is enabled", () => {
    const result = validate({
      canUseProductVariants: true,
      variantAttributes: [attribute()],
      values: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Box",
        price: "1000",
        productTypeId: "type-1",
        variants: {
          selectedAttributeIds: ["size"],
          selectedValueIdsByAttributeId: {
            size: ["size-m"],
          },
          combinations: {
            "size=size-m": {
              price: "-1",
              status: "ACTIVE",
              stock: null,
            },
          },
        },
      },
    });

    expect(result).toMatchObject({
      success: false,
      errorMessage: "invalid price",
    });
  });

  it("rejects fractional prices outside wholesale catalogs", () => {
    const result = validate({
      values: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Box",
        price: "1000.50",
      },
    });

    expect(result).toMatchObject({
      success: false,
      errorMessage: "invalid price",
    });
  });

  it("ignores invalid price values when price editing is disabled", () => {
    const result = validate({
      canEditPrice: false,
      values: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Box",
        price: "1000.50",
      },
    });

    expect(result).toMatchObject({
      success: true,
      normalizedPrice: null,
    });
  });

  it("allows cents for wholesale catalogs", () => {
    const result = validate({
      priceFormatMode: "decimal",
      values: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Box",
        price: "1000.50",
      },
    });

    expect(result).toMatchObject({
      success: true,
      normalizedPrice: 1000.5,
    });
  });

  it("rejects more than two fraction digits for wholesale catalogs", () => {
    const result = validate({
      priceFormatMode: "decimal",
      values: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Box",
        price: "1000.555",
      },
    });

    expect(result).toMatchObject({
      success: false,
      errorMessage: "invalid price",
    });
  });

  it("validates base sale units when variants are disabled", () => {
    const result = validate({
      canUseCatalogSaleUnits: true,
      canUseProductVariants: false,
      variantAttributes: [attribute()],
      values: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Box",
        price: "1000",
        saleUnits: [
          {
            label: "Box",
            baseQuantity: "0",
            price: "900",
            isDefault: true,
          },
        ],
      },
    });

    expect(result.success).toBe(false);
  });
});
