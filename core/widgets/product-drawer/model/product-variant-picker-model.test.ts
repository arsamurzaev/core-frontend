import type {
  ProductVariantDto,
  VariantAttributeDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import {
  buildProductVariantGroups,
  buildProductVariantSelection,
  findBestProductVariant,
  getInitialProductVariantId,
  isProductVariantPurchasable,
  isProductVariantValueSelectable,
} from "./product-variant-picker-model";

const NOW = "2026-05-13T00:00:00.000Z";

function variantAttribute(params: {
  attributeId: string;
  attributeLabel: string;
  enumValueId: string;
  valueLabel: string;
}): VariantAttributeDto {
  return {
    id: `${params.attributeId}-${params.enumValueId}`,
    attributeId: params.attributeId,
    enumValueId: params.enumValueId,
    attribute: {
      id: params.attributeId,
      key: params.attributeId,
      displayName: params.attributeLabel,
      dataType: "ENUM",
      isRequired: false,
      isVariantAttribute: true,
      isFilterable: true,
      displayOrder: 0,
      isHidden: false,
    },
    enumValue: {
      id: params.enumValueId,
      value: params.enumValueId,
      displayName: params.valueLabel,
      displayOrder: 0,
      businessId: null,
    },
  };
}

function variant(overrides: Partial<ProductVariantDto> = {}): ProductVariantDto {
  return {
    id: "variant-1",
    sku: "SKU-1",
    variantKey: "base",
    stock: 10,
    price: "100",
    status: "ACTIVE",
    isAvailable: true,
    createdAt: NOW,
    updatedAt: NOW,
    attributes: [],
    saleUnits: [],
    ...overrides,
  };
}

describe("isProductVariantPurchasable", () => {
  it("respects stock only when stock enforcement is enabled", () => {
    const outOfStock = variant({ stock: 0 });

    expect(isProductVariantPurchasable(outOfStock)).toBe(false);
    expect(
      isProductVariantPurchasable(outOfStock, {
        shouldEnforceStock: false,
      }),
    ).toBe(true);
  });
});

describe("getInitialProductVariantId", () => {
  it("allows a query variant with zero stock when stock enforcement is disabled", () => {
    const variants = [
      variant({
        id: "zero-stock",
        stock: 0,
      }),
    ];

    expect(
      getInitialProductVariantId({
        queryVariantId: "zero-stock",
        shouldEnforceStock: false,
        variants,
      }),
    ).toBe("zero-stock");
  });
});

describe("product variant picker model", () => {
  it("builds groups and selection from variant attributes", () => {
    const redSmall = variant({
      attributes: [
        variantAttribute({
          attributeId: "color",
          attributeLabel: "Color",
          enumValueId: "red",
          valueLabel: "Red",
        }),
        variantAttribute({
          attributeId: "size",
          attributeLabel: "Size",
          enumValueId: "s",
          valueLabel: "S",
        }),
      ],
    });

    expect(buildProductVariantSelection(redSmall)).toEqual({
      color: "red",
      size: "s",
    });
    expect(buildProductVariantGroups([redSmall])).toMatchObject([
      {
        id: "color",
        values: [{ id: "red", label: "Red" }],
      },
      {
        id: "size",
        values: [{ id: "s", label: "S" }],
      },
    ]);
  });

  it("finds the best purchasable variant for a partial selection", () => {
    const redSmall = variant({
      id: "red-small",
      attributes: [
        variantAttribute({
          attributeId: "color",
          attributeLabel: "Color",
          enumValueId: "red",
          valueLabel: "Red",
        }),
      ],
    });
    const blueSmall = variant({
      id: "blue-small",
      attributes: [
        variantAttribute({
          attributeId: "color",
          attributeLabel: "Color",
          enumValueId: "blue",
          valueLabel: "Blue",
        }),
      ],
      stock: 0,
    });

    expect(
      findBestProductVariant([redSmall, blueSmall], {
        color: "blue",
      }),
    ).toBeNull();
    expect(
      findBestProductVariant(
        [redSmall, blueSmall],
        {
          color: "blue",
        },
        {
          shouldEnforceStock: false,
        },
      )?.id,
    ).toBe("blue-small");
  });

  it("disables picker values only when no purchasable variant has the value", () => {
    const blue = variant({
      attributes: [
        variantAttribute({
          attributeId: "color",
          attributeLabel: "Color",
          enumValueId: "blue",
          valueLabel: "Blue",
        }),
      ],
      stock: 0,
    });

    expect(
      isProductVariantValueSelectable({
        attributeId: "color",
        enumValueId: "blue",
        variants: [blue],
      }),
    ).toBe(false);
    expect(
      isProductVariantValueSelectable({
        attributeId: "color",
        enumValueId: "blue",
        shouldEnforceStock: false,
        variants: [blue],
      }),
    ).toBe(true);
  });
});
