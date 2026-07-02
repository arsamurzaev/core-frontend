import {
  AttributeDtoDataType,
  AttributeEnumValueDtoSource,
  ProductAttributeRefDtoDataType,
  ProductVariantDtoKind,
  ProductVariantDtoStatus,
  ProductWithDetailsDtoAvailabilityState,
  ProductWithDetailsDtoPriceState,
  ProductWithDetailsDtoStatus,
  type AttributeDto,
  type AttributeEnumValueDto,
  type ProductAttributeDto,
  type ProductTypeRefDto,
  type ProductVariantDto,
  type ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it, vi } from "vitest";
import { CREATE_PRODUCT_FORM_DEFAULT_VALUES } from "@/core/modules/product/editor";
import {
  buildEditProductFormValues,
  parseEditProductUpdatePayload,
  writeUpdatedProductToEditCache,
} from "./edit-product-drawer-data";

const NOW = "2026-05-13T00:00:00.000Z";

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

function enumValue(
  overrides: Partial<AttributeEnumValueDto> = {},
): AttributeEnumValueDto {
  return {
    id: "m",
    attributeId: "size",
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

function productAttribute(
  overrides: Partial<ProductAttributeDto> = {},
): ProductAttributeDto {
  return {
    id: "product-attribute-1",
    attributeId: "subtitle",
    enumValueId: null,
    valueString: "Old subtitle",
    valueInteger: null,
    valueDecimal: null,
    valueBoolean: null,
    valueDateTime: null,
    enumValue: null,
    attribute: {
      id: "subtitle",
      key: "subtitle",
      displayName: "Subtitle",
      dataType: ProductAttributeRefDtoDataType.STRING,
      isRequired: false,
      isVariantAttribute: false,
      isFilterable: false,
      displayOrder: 1,
      isHidden: false,
    },
    ...overrides,
  };
}

function variant(
  overrides: Partial<ProductVariantDto> = {},
): ProductVariantDto {
  return {
    id: "variant-1",
    sku: "SKU-1",
    variantKey: "base",
    kind: ProductVariantDtoKind.DEFAULT,
    stock: 1,
    price: "1000",
    status: ProductVariantDtoStatus.ACTIVE,
    isAvailable: true,
    createdAt: NOW,
    updatedAt: NOW,
    attributes: [],
    saleUnits: [],
    ...overrides,
  };
}

function productType(
  overrides: Partial<ProductTypeRefDto> = {},
): ProductTypeRefDto {
  return {
    id: "product-type-1",
    code: "product-type-1",
    name: "Product type",
    ...overrides,
  };
}

function product(
  overrides: Partial<ProductWithDetailsDto> = {},
): ProductWithDetailsDto {
  return {
    id: "product-1",
    sku: "SKU-1",
    name: "Product",
    slug: "product",
    price: "1000",
    priceState: ProductWithDetailsDtoPriceState.KNOWN,
    displayPrice: "1000",
    minPrice: "1000",
    maxPrice: "1000",
    availabilityState: ProductWithDetailsDtoAvailabilityState.AVAILABLE,
    stock: 1,
    defaultVariantId: "variant-1",
    media: [],
    brand: null,
    productType: null,
    categories: [],
    integration: null,
    saleUnits: [],
    requiresVariantSelection: false,
    isPopular: false,
    status: ProductWithDetailsDtoStatus.ACTIVE,
    position: 0,
    createdAt: NOW,
    updatedAt: NOW,
    productAttributes: [],
    variantSummary: {
      minPrice: null,
      maxPrice: null,
      activeCount: 0,
      totalStock: 0,
      singleVariantId: null,
    },
    variantPickerOptions: [],
    variants: [],
    seo: null,
    ...overrides,
  };
}

describe("edit product drawer data", () => {
  it("writes updated product response into the edit product cache", () => {
    const queryClient = {
      setQueryData: vi.fn(),
    };
    const updatedProduct = product({
      id: "product-1",
      saleUnits: [
        {
          id: "sale-unit-1",
          catalogSaleUnitId: "box",
          code: "box",
          name: "Box",
          baseQuantity: "12",
          price: "950",
          barcode: null,
          isDefault: true,
          isActive: true,
          displayOrder: 1,
          createdAt: NOW,
          updatedAt: NOW,
          catalogSaleUnit: null,
        },
      ],
    });

    writeUpdatedProductToEditCache(
      queryClient as never,
      "product-1",
      updatedProduct,
    );

    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      ["/product/product-1"],
      updatedProduct,
    );
  });

  it("builds form values with discount and base sale units from default variant", () => {
    const values = buildEditProductFormValues(
      product({
        categories: [{ id: " category-1 ", name: "Category", position: 0 }],
        productAttributes: [
          productAttribute({
            attributeId: "discount",
            valueString: null,
            valueDecimal: "10",
            attribute: {
              id: "discount",
              key: "discount",
              displayName: "Discount",
              dataType: ProductAttributeRefDtoDataType.DECIMAL,
              isRequired: false,
              isVariantAttribute: false,
              isFilterable: false,
              displayOrder: 1,
              isHidden: false,
            },
          }),
        ],
        variants: [
          variant({
            saleUnits: [
              {
                id: "sale-unit-1",
                catalogSaleUnitId: "box",
                code: "box",
                name: "Box",
                baseQuantity: "12",
                price: "950",
                barcode: null,
                isDefault: true,
                isActive: true,
                displayOrder: 1,
                createdAt: NOW,
                updatedAt: NOW,
                catalogSaleUnit: {
                  id: "box",
                  code: "box",
                  name: "Box",
                  defaultBaseQuantity: "12",
                },
              },
            ],
          }),
        ],
      }),
      [attribute({ id: "discount", dataType: AttributeDtoDataType.DECIMAL })],
    );

    expect(values.categoryIds).toEqual(["category-1"]);
    expect(values.hasDiscount).toBe(true);
    expect(values.saleUnits).toEqual([
      {
        id: "sale-unit-1",
        catalogSaleUnitId: "box",
        catalogSaleUnitName: "Box",
        catalogDefaultBaseQuantity: "12",
        label: "Box",
        baseQuantity: "12",
        price: "950",
        isDefault: true,
      },
    ]);
  });

  it("does not materialize discount values when discounts are disabled", () => {
    const values = buildEditProductFormValues(
      product({
        productAttributes: [
          productAttribute({
            attributeId: "discount",
            valueString: null,
            valueDecimal: "10",
            attribute: {
              id: "discount",
              key: "discount",
              displayName: "Discount",
              dataType: ProductAttributeRefDtoDataType.DECIMAL,
              isRequired: false,
              isVariantAttribute: false,
              isFilterable: false,
              displayOrder: 1,
              isHidden: false,
            },
          }),
        ],
      }),
      [attribute({ id: "discount", dataType: AttributeDtoDataType.DECIMAL })],
      [],
      "integer",
      false,
    );

    expect(values.hasDiscount).toBe(false);
    expect(values.attributes.discount).toBeUndefined();
  });

  it("does not materialize hidden variant defaults but restores saved variants when capability returns", () => {
    const sizeAttribute = attribute({
      id: "size",
      key: "size",
      displayName: "Size",
      dataType: AttributeDtoDataType.ENUM,
      isVariantAttribute: true,
      enumValues: [
        enumValue({
          id: "m",
          attributeId: "size",
          displayName: "Medium",
        }),
      ],
    });
    const sourceProduct = product({
      productType: productType(),
      variants: [
        variant({
          price: "1200",
          stock: 4,
          variantKey: "size=m",
          attributes: [
            {
              id: "variant-attribute-1",
              attributeId: "size",
              enumValueId: "m",
              attribute: {
                id: "size",
                key: "size",
                displayName: "Size",
                dataType: "ENUM",
                isRequired: false,
                isVariantAttribute: true,
                isFilterable: false,
                displayOrder: 1,
                isHidden: false,
              },
              enumValue: {
                id: "m",
                value: "m",
                displayName: "Medium",
                displayOrder: 1,
                businessId: null,
              },
            },
          ],
        }),
      ],
    });

    expect(buildEditProductFormValues(sourceProduct, [], []).variants).toEqual(
      CREATE_PRODUCT_FORM_DEFAULT_VALUES.variants,
    );

    expect(
      buildEditProductFormValues(sourceProduct, [], [sizeAttribute]).variants,
    ).toMatchObject({
      selectedAttributeIds: ["size"],
      selectedValueIdsByAttributeId: {
        size: ["m"],
      },
      combinations: {
        "size=m": {
          price: "1200",
          status: "ACTIVE",
          stock: 4,
        },
      },
    });
  });

  it("clears existing base sale units and removed attributes in update payload", () => {
    const payload = parseEditProductUpdatePayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: " Updated product ",
        price: "1200",
        categoryIds: [" category-1 "],
        attributes: {
          subtitle: "",
        },
        saleUnits: [],
      },
      mediaIds: ["media-1"],
      persistedAttributeValues: {
        subtitle: "Old subtitle",
      },
      product: product({
        variants: [
          variant({
            saleUnits: [
              {
                id: "sale-unit-1",
                catalogSaleUnitId: "box",
                code: "box",
                name: "Box",
                baseQuantity: "12",
                price: "950",
                barcode: null,
                isDefault: true,
                isActive: true,
                displayOrder: 1,
                createdAt: NOW,
                updatedAt: NOW,
                catalogSaleUnit: null,
              },
            ],
          }),
        ],
      }),
      productAttributes: [attribute()],
      canUseCatalogSaleUnits: true,
    });

    expect(payload).toMatchObject({
      name: "Updated product",
      price: 1200,
      mediaIds: ["media-1"],
      brandId: null,
      categories: ["category-1"],
      attributes: [],
      removeAttributeIds: ["subtitle"],
      saleUnits: [],
    });
    expect(payload).not.toHaveProperty("variants");
  });

  it("removes persisted discount attributes when discounts are disabled", () => {
    const payload = parseEditProductUpdatePayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Product",
        price: "1000",
        hasDiscount: true,
        attributes: {
          discount: "10",
        },
      },
      mediaIds: [],
      persistedAttributeValues: {
        discount: "15",
      },
      product: product(),
      productAttributes: [
        attribute({
          id: "discount",
          key: "discount",
          dataType: AttributeDtoDataType.DECIMAL,
        }),
      ],
      canUseCatalogSaleUnits: false,
      canUseDiscounts: false,
    });

    expect(payload.attributes).toEqual([]);
    expect(payload.removeAttributeIds).toEqual(["discount"]);
  });

  it("omits price and sale units when price editing is disabled", () => {
    const payload = parseEditProductUpdatePayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Product",
        price: "1",
        saleUnits: [
          {
            catalogSaleUnitId: "box",
            catalogSaleUnitName: "Box",
            label: "Box",
            baseQuantity: "12",
            price: "1",
            isDefault: true,
          },
        ],
      },
      mediaIds: [],
      persistedAttributeValues: {},
      product: product({
        price: "1000",
        saleUnits: [
          {
            id: "sale-unit-1",
            catalogSaleUnitId: "box",
            code: "box",
            name: "Box",
            baseQuantity: "12",
            price: "950",
            barcode: null,
            isDefault: true,
            isActive: true,
            displayOrder: 1,
            createdAt: NOW,
            updatedAt: NOW,
            catalogSaleUnit: null,
          },
        ],
      }),
      productAttributes: [],
      canEditPrice: false,
      canUseCatalogSaleUnits: true,
    });

    expect(payload).not.toHaveProperty("price");
    expect(payload).not.toHaveProperty("saleUnits");
  });

  it("sends root sale units in update payload when variants feature is disabled", () => {
    const payload = parseEditProductUpdatePayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Product",
        price: "1200",
        saleUnits: [
          {
            catalogSaleUnitId: "box",
            catalogSaleUnitName: "Box",
            label: "Box",
            baseQuantity: "12",
            price: "950",
            isDefault: true,
          },
        ],
      },
      mediaIds: [],
      persistedAttributeValues: {},
      product: product({
        variants: [variant({ variantKey: "default" })],
      }),
      productAttributes: [],
      canUseCatalogSaleUnits: true,
      canUseProductVariants: false,
    });

    expect(payload).toMatchObject({
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

  it("includes changed product type in update payload", () => {
    const payload = parseEditProductUpdatePayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Product",
        price: "1000",
        productTypeId: "product-type-1",
      },
      mediaIds: [],
      persistedAttributeValues: {},
      product: product({ productType: null }),
      productAttributes: [],
      canUseCatalogSaleUnits: true,
    });

    expect(payload).toHaveProperty("productTypeId", "product-type-1");
  });

  it("replaces variant matrix in the same update payload when product type changes", () => {
    const sizeAttribute = attribute({
      id: "size",
      key: "size",
      displayName: "Size",
      dataType: AttributeDtoDataType.ENUM,
      isVariantAttribute: true,
      enumValues: [
        enumValue({
          id: "s",
          attributeId: "size",
          value: "s",
          displayName: "Small",
        }),
      ],
    });

    const payload = parseEditProductUpdatePayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Product",
        price: "1000",
        productTypeId: "product-type-1",
        saleUnits: [
          {
            catalogSaleUnitId: "box",
            catalogSaleUnitName: "Box",
            label: "Box",
            baseQuantity: "12",
            price: "950",
            isDefault: true,
          },
        ],
        variants: {
          selectedAttributeIds: ["size"],
          selectedValueIdsByAttributeId: {
            size: ["s"],
          },
          combinations: {
            "size=s": {
              price: "1300",
              status: "ACTIVE",
              stock: 3,
            },
          },
        },
      },
      mediaIds: [],
      persistedAttributeValues: {},
      product: product({
        productType: null,
        variants: [variant({ variantKey: "default" })],
      }),
      productAttributes: [],
      variantAttributes: [sizeAttribute],
      canUseProductTypes: true,
      canUseCatalogSaleUnits: true,
      canUseProductVariants: true,
    });

    expect(payload).toMatchObject({
      productTypeId: "product-type-1",
      variantMatrix: [
        {
          price: 1300,
          status: "ACTIVE",
          stock: 3,
          attributes: [
            {
              attributeId: "size",
              enumValueId: "s",
            },
          ],
        },
      ],
    });
    expect(payload).not.toHaveProperty("variants");
  });

  it("sends an empty variant matrix replacement when matrix editor is active", () => {
    const payload = parseEditProductUpdatePayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Product",
        price: "1000",
        saleUnits: [
          {
            catalogSaleUnitId: "box",
            catalogSaleUnitName: "Box",
            label: "Box",
            baseQuantity: "12",
            price: "950",
            isDefault: true,
          },
        ],
      },
      mediaIds: [],
      persistedAttributeValues: {},
      product: product({
        variants: [variant({ variantKey: "default" })],
      }),
      productAttributes: [],
      variantAttributes: [
        attribute({
          id: "size",
          key: "size",
          displayName: "Size",
          dataType: AttributeDtoDataType.ENUM,
          isVariantAttribute: true,
        }),
      ],
      canUseCatalogSaleUnits: true,
      canUseProductVariants: true,
    });

    expect(payload).toHaveProperty("variantMatrix", []);
    expect(payload).not.toHaveProperty("variants");
  });

  it("clears existing brand in update payload", () => {
    const payload = parseEditProductUpdatePayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Product",
        price: "1000",
        brandId: undefined,
      },
      mediaIds: [],
      persistedAttributeValues: {},
      product: product({
        brand: {
          id: "brand-1",
          name: "Brand",
          slug: "brand",
        },
      }),
      productAttributes: [],
      canUseCatalogSaleUnits: true,
    });

    expect(payload).toHaveProperty("brandId", null);
  });

  it("clears product type in update payload", () => {
    const payload = parseEditProductUpdatePayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Product",
        price: "1000",
        productTypeId: undefined,
      },
      mediaIds: [],
      persistedAttributeValues: {},
      product: product({ productType: productType() }),
      productAttributes: [],
      canUseCatalogSaleUnits: true,
    });

    expect(payload).toHaveProperty("productTypeId", null);
  });

  it("removes old product type attributes when product type is cleared", () => {
    const payload = parseEditProductUpdatePayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Product",
        price: "1000",
        productTypeId: undefined,
        attributes: {
          material: "Leather",
          subtitle: "Keep me",
          "typed-flag": false,
        },
      },
      mediaIds: [],
      persistedAttributeValues: {
        material: "Old leather",
        subtitle: "Old subtitle",
        "typed-flag": false,
      },
      product: product({ productType: productType() }),
      productAttributes: [
        attribute({
          id: "material",
          key: "material",
          typeIds: ["product-type-1"],
          isRequired: true,
        }),
        attribute({
          id: "typed-flag",
          key: "typed-flag",
          typeIds: ["product-type-1"],
          dataType: AttributeDtoDataType.BOOLEAN,
        }),
        attribute({
          id: "subtitle",
          key: "subtitle",
          typeIds: ["type-1"],
        }),
      ],
      canUseCatalogSaleUnits: true,
    });

    expect(payload).toMatchObject({
      productTypeId: null,
      attributes: [{ attributeId: "subtitle", valueString: "Keep me" }],
      removeAttributeIds: ["material", "typed-flag"],
    });
  });

  it("removes persisted old type attributes after cleared type schema disappears", () => {
    const payload = parseEditProductUpdatePayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Product",
        price: "1000",
        productTypeId: undefined,
        attributes: {
          subtitle: "Keep me",
        },
      },
      mediaIds: [],
      persistedAttributeValues: {
        subtitle: "Old subtitle",
      },
      product: product({
        productType: productType(),
        productAttributes: [
          productAttribute({
            attributeId: "material",
            valueString: "Old leather",
            attribute: {
              ...productAttribute().attribute,
              id: "material",
              key: "material",
              displayName: "Material",
            },
          }),
          productAttribute(),
        ],
      }),
      productAttributes: [attribute()],
      canUseProductTypes: true,
      canUseCatalogSaleUnits: true,
    });

    expect(payload).toMatchObject({
      productTypeId: null,
      attributes: [{ attributeId: "subtitle", valueString: "Keep me" }],
      removeAttributeIds: ["material"],
    });
  });

  it("clears old variant matrix when product type is cleared after variant schema disappears", () => {
    const payload = parseEditProductUpdatePayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Product",
        price: "1000",
        productTypeId: undefined,
      },
      mediaIds: [],
      persistedAttributeValues: {},
      product: product({
        productType: productType(),
        variants: [
          variant({
            variantKey: "size=m",
            attributes: [
              {
                id: "variant-attribute-1",
                attributeId: "size",
                enumValueId: "m",
                attribute: {
                  id: "size",
                  key: "size",
                  displayName: "Size",
                  dataType: "ENUM",
                  isRequired: false,
                  isVariantAttribute: true,
                  isFilterable: false,
                  displayOrder: 1,
                  isHidden: false,
                },
                enumValue: {
                  id: "m",
                  value: "m",
                  displayName: "Medium",
                  displayOrder: 1,
                  businessId: null,
                },
              },
            ],
          }),
        ],
      }),
      productAttributes: [],
      variantAttributes: [],
      canUseProductTypes: true,
      canUseProductVariants: true,
      canUseCatalogSaleUnits: true,
    });

    expect(payload).toMatchObject({
      productTypeId: null,
      variantMatrix: [],
    });
    expect(payload).not.toHaveProperty("variants");
  });

  it("does not include unchanged product type in update payload", () => {
    const payload = parseEditProductUpdatePayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Product",
        price: "1000",
        productTypeId: "product-type-1",
      },
      mediaIds: [],
      persistedAttributeValues: {},
      product: product({ productType: productType() }),
      productAttributes: [],
      canUseCatalogSaleUnits: true,
    });

    expect(payload).not.toHaveProperty("productTypeId");
  });

  it("does not clear product type when product type capability is disabled", () => {
    const payload = parseEditProductUpdatePayload({
      formValues: {
        ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
        name: "Product",
        price: "1000",
        productTypeId: undefined,
        attributes: {
          material: "",
        },
      },
      mediaIds: [],
      persistedAttributeValues: {
        material: "Old leather",
      },
      product: product({ productType: productType() }),
      productAttributes: [
        attribute({
          id: "material",
          key: "material",
          typeIds: ["product-type-1"],
        }),
      ],
      canUseProductTypes: false,
      canUseCatalogSaleUnits: false,
    });

    expect(payload).not.toHaveProperty("productTypeId");
    expect(payload.removeAttributeIds).toBeUndefined();
  });
});
