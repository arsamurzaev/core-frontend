import {
  AttributeDtoDataType,
  AttributeEnumValueDtoSource,
  ProductVariantDtoStatus,
  type AttributeDto,
  type AttributeEnumValueDto,
  type ProductVariantDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { buildVariantCombinationKey } from "./product-variant-matrix";
import {
  buildCreateVariantsPayload,
  buildSetVariantMatrixPayload,
  buildVariantsFormValueFromExisting,
} from "./product-variant-payload";

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

function variant(overrides: Partial<ProductVariantDto>): ProductVariantDto {
  return {
    id: "variant-1",
    sku: "SKU-1",
    variantKey: "size=m",
    stock: 1,
    price: "100",
    status: ProductVariantDtoStatus.ACTIVE,
    isAvailable: true,
    createdAt: NOW,
    updatedAt: NOW,
    attributes: [],
    saleUnits: [],
    ...overrides,
  };
}

describe("product variant payload model", () => {
  it("builds create payload only for enabled combinations", () => {
    const size = attribute({
      id: "size",
      enumValues: [
        enumValue({
          id: "m",
          attributeId: "size",
          value: "m",
          displayName: "Medium",
        }),
        enumValue({
          id: "l",
          attributeId: "size",
          value: "l",
          displayName: "Large",
          displayOrder: 2,
        }),
      ],
    });
    const mediumKey = buildVariantCombinationKey(
      [{ attributeId: "size", enumValueId: "m" }],
      [size],
    );
    const largeKey = buildVariantCombinationKey(
      [{ attributeId: "size", enumValueId: "l" }],
      [size],
    );

    expect(
      buildCreateVariantsPayload(
        {
          selectedAttributeIds: ["size"],
          selectedValueIdsByAttributeId: {
            size: ["m", "l"],
          },
          combinations: {
            [mediumKey]: {
              price: "1000",
              saleUnits: [
                {
                  catalogSaleUnitId: "box",
                  catalogSaleUnitName: "Box",
                  label: "",
                  baseQuantity: "12",
                  price: "900",
                  isDefault: true,
                },
              ],
              status: "ACTIVE",
              stock: 5,
            },
            [largeKey]: {
              status: "DISABLED",
              stock: 10,
            },
          },
        },
        [size],
      ),
    ).toEqual([
      {
        price: 1000,
        status: "ACTIVE",
        stock: 5,
        attributes: [
          {
            attributeId: "size",
            enumValueId: "m",
          },
        ],
        saleUnits: [
          {
            catalogSaleUnitId: "box",
            baseQuantity: 12,
            price: 900,
            isDefault: true,
          },
        ],
      },
    ]);
  });

  it("wraps create payload for set variant matrix", () => {
    expect(buildSetVariantMatrixPayload(undefined, [])).toEqual({
      items: [],
    });
  });

  it("builds form values from existing variants", () => {
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

    expect(
      buildVariantsFormValueFromExisting(
        [
          variant({
            price: "1200",
            stock: 4,
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
            saleUnits: [
              {
                id: "sale-unit-1",
                catalogSaleUnitId: "box",
                code: "box",
                name: "Box",
                baseQuantity: "12",
                price: "1100",
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
        [size],
      ),
    ).toEqual({
      selectedAttributeIds: ["size"],
      selectedValueIdsByAttributeId: {
        size: ["m"],
      },
      combinations: {
        "size=m": {
          price: "1200",
          saleUnits: [
            {
              id: "sale-unit-1",
              catalogSaleUnitId: "box",
              catalogSaleUnitName: "Box",
              label: "Box",
              baseQuantity: "12",
              price: "1100",
              isDefault: true,
            },
          ],
          status: "ACTIVE",
          stock: 4,
        },
      },
    });
  });
});
