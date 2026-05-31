import {
  AttributeDtoDataType,
  AttributeEnumValueDtoSource,
  type AttributeDto,
  type AttributeEnumValueDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { CREATE_PRODUCT_FORM_DEFAULT_VALUES } from "@/core/modules/product/editor/model/form-config";
import { buildVariantCombinationKey } from "@/core/modules/product/editor/model/product-variants";
import { parseCreateProductPayload } from "./create-product-drawer-data";

const NOW = "2026-05-13T00:00:00.000Z";

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
    createdAt: NOW,
    updatedAt: NOW,
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
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("create product drawer data", () => {
  it("omits brand id when brand is cleared", () => {
    const payload = parseCreateProductPayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Box",
        price: "1000",
        brandId: "",
      },
      mediaIds: [],
      normalizedPrice: 1000,
      productAttributes: [],
      variantAttributes: [],
      canUseProductTypes: true,
      canUseProductVariants: true,
      canUseCatalogSaleUnits: false,
    });

    expect(payload).not.toHaveProperty("brandId");
  });

  it("omits discount attributes when discounts are disabled", () => {
    const payload = parseCreateProductPayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Box",
        price: "1000",
        hasDiscount: true,
        attributes: {
          discount: "10",
        },
      },
      mediaIds: [],
      normalizedPrice: 1000,
      productAttributes: [
        attribute({
          id: "discount",
          key: "discount",
          dataType: AttributeDtoDataType.DECIMAL,
          isVariantAttribute: false,
        }),
      ],
      variantAttributes: [],
      canUseDiscounts: false,
      canUseProductTypes: true,
      canUseProductVariants: true,
      canUseCatalogSaleUnits: false,
    });

    expect(payload).not.toHaveProperty("attributes");
  });

  it("omits price and sale units when price editing is disabled", () => {
    const payload = parseCreateProductPayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Box",
        price: "1000",
        saleUnits: [
          {
            catalogSaleUnitId: "box",
            catalogSaleUnitName: "Box",
            label: "",
            baseQuantity: "12",
            price: "950",
            isDefault: true,
          },
        ],
      },
      mediaIds: [],
      normalizedPrice: 1000,
      productAttributes: [],
      variantAttributes: [],
      canEditPrice: false,
      canUseProductTypes: true,
      canUseProductVariants: false,
      canUseCatalogSaleUnits: true,
    });

    expect(payload).not.toHaveProperty("price");
    expect(payload).not.toHaveProperty("saleUnits");
  });

  it("keeps base sale units when variants feature is disabled", () => {
    const payload = parseCreateProductPayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Box",
        price: "1000",
        saleUnits: [
          {
            catalogSaleUnitId: "box",
            catalogSaleUnitName: "Box",
            label: "",
            baseQuantity: "12",
            price: "950",
            isDefault: true,
          },
        ],
      },
      mediaIds: [],
      normalizedPrice: 1000,
      productAttributes: [],
      variantAttributes: [attribute()],
      canUseProductTypes: true,
      canUseProductVariants: false,
      canUseCatalogSaleUnits: true,
    });

    expect(payload).toMatchObject({
      name: "Box",
      price: 1000,
      saleUnits: [
        {
          catalogSaleUnitId: "box",
          baseQuantity: 12,
          price: 950,
          isDefault: true,
        },
      ],
    });
    expect(payload).not.toHaveProperty("variants");
  });

  it("keeps sale units on variant rows when variants feature is enabled", () => {
    const size = attribute({
      id: "size",
      enumValues: [
        enumValue({
          id: "m",
          attributeId: "size",
          value: "m",
          displayName: "Medium",
        }),
      ],
    });
    const mediumKey = buildVariantCombinationKey(
      [{ attributeId: "size", enumValueId: "m" }],
      [size],
    );

    const payload = parseCreateProductPayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Box",
        price: "1000",
        saleUnits: [
          {
            catalogSaleUnitId: "box",
            catalogSaleUnitName: "Box",
            label: "",
            baseQuantity: "12",
            price: "950",
            isDefault: true,
          },
        ],
        variants: {
          selectedAttributeIds: ["size"],
          selectedValueIdsByAttributeId: {
            size: ["m"],
          },
          combinations: {
            [mediumKey]: {
              price: "1200",
              saleUnits: [
                {
                  catalogSaleUnitId: "box",
                  catalogSaleUnitName: "Box",
                  label: "",
                  baseQuantity: "12",
                  price: "950",
                  isDefault: true,
                },
              ],
              status: "ACTIVE",
              stock: 5,
            },
          },
        },
      },
      mediaIds: [],
      normalizedPrice: 1000,
      productAttributes: [],
      variantAttributes: [size],
      canUseProductTypes: true,
      canUseProductVariants: true,
      canUseCatalogSaleUnits: true,
    });

    expect(payload).toMatchObject({
      variants: [
        {
          price: 1200,
          status: "ACTIVE",
          stock: 5,
          saleUnits: [
            {
              catalogSaleUnitId: "box",
              baseQuantity: 12,
              price: 950,
              isDefault: true,
            },
          ],
        },
      ],
    });
    expect(payload).not.toHaveProperty("saleUnits");
  });
});
