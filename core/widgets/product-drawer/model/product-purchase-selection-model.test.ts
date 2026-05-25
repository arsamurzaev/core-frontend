import { describe, expect, it } from "vitest";
import {
  buildProductPurchaseCartSnapshot,
  getAvailableProductSaleUnits,
  getSelectableProductVariants,
  isProductVariantSelectionRequired,
  resolveNextProductSaleUnitId,
  resolveProductPurchaseEffectiveMaxQuantity,
  resolveProductPurchaseMaxQuantity,
  resolveProductPurchasePricing,
  resolveProductPurchaseTotalPricing,
  resolveSinglePurchasableProductVariantId,
} from "./product-purchase-selection-model";
import type { ProductSaleUnit } from "@/core/modules/product/model/sale-units";
import {
  ProductVariantDtoKind,
  type ProductVariantDto,
  type ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";

function saleUnit(overrides: Partial<ProductSaleUnit>): ProductSaleUnit {
  return {
    id: "unit-1",
    catalogSaleUnitId: null,
    label: "Unit",
    kind: "piece",
    price: 100,
    baseQuantity: 1,
    containsQuantity: null,
    containsSaleUnitId: null,
    containsSaleUnitLabel: null,
    isDefault: false,
    isActive: true,
    displayOrder: 0,
    ...overrides,
  };
}

function variant(overrides: Partial<ProductVariantDto>): ProductVariantDto {
  return {
    id: "variant-1",
    sku: "SKU-1",
    variantKey: "base",
    kind: ProductVariantDtoKind.DEFAULT,
    stock: 10,
    price: "100",
    status: "ACTIVE",
    isAvailable: true,
    createdAt: "2026-05-13T00:00:00.000Z",
    updatedAt: "2026-05-13T00:00:00.000Z",
    attributes: [],
    saleUnits: [],
    ...overrides,
  };
}

describe("product purchase selection model", () => {
  it("hides backend variant and sale-unit data when capabilities are disabled", () => {
    const product = {
      productType: { id: "type-1" },
      variants: [
        variant({
          id: "variant-1",
          saleUnits: [
            saleUnit({
              id: "box",
            }) as unknown as ProductVariantDto["saleUnits"][number],
          ],
        }),
      ],
    } as unknown as ProductWithDetailsDto;

    expect(
      getSelectableProductVariants({
        canUseProductVariants: false,
        product,
      }),
    ).toEqual([]);
    expect(
      getAvailableProductSaleUnits({
        canUseCatalogSaleUnits: false,
        product,
        saleUnitSource: product.variants[0],
      }),
    ).toEqual([]);
  });

  it("selects initial sale unit, then preserves current valid selection", () => {
    const units = [
      saleUnit({ id: "piece", isDefault: true }),
      saleUnit({ id: "box", isDefault: false }),
    ];

    expect(
      resolveNextProductSaleUnitId({
        currentSaleUnitId: null,
        initialSaleUnitId: "box",
        saleUnits: units,
        shouldApplyInitialSaleUnit: true,
      }),
    ).toBe("box");

    expect(
      resolveNextProductSaleUnitId({
        currentSaleUnitId: "box",
        saleUnits: units,
        shouldApplyInitialSaleUnit: false,
      }),
    ).toBe("box");
  });

  it("falls back to the default sale unit when selection is missing", () => {
    expect(
      resolveNextProductSaleUnitId({
        currentSaleUnitId: "missing",
        initialSaleUnitId: "also-missing",
        saleUnits: [
          saleUnit({ id: "box" }),
          saleUnit({ id: "piece", isDefault: true }),
        ],
        shouldApplyInitialSaleUnit: false,
      }),
    ).toBe("piece");
  });

  it("prices selected sale unit before selected variant and applies discount", () => {
    expect(
      resolveProductPurchasePricing({
        discount: 10,
        displayPrice: 1000,
        hasDiscount: true,
        price: 1000,
        selectedSaleUnit: saleUnit({ id: "box", price: 500 }),
        selectedVariant: variant({ price: "800" }),
      }),
    ).toEqual({
      displayPrice: 450,
      hasSelectedDiscount: true,
      selectedBasePrice: 500,
    });
  });

  it("multiplies drawer price by selected cart quantity", () => {
    expect(
      resolveProductPurchaseTotalPricing({
        displayPrice: 900,
        quantity: 3,
        selectedBasePrice: 1000,
      }),
    ).toEqual({
      displayPrice: 2700,
      selectedBasePrice: 3000,
    });
  });

  it("shows unit price before the product is added to cart", () => {
    expect(
      resolveProductPurchaseTotalPricing({
        displayPrice: 900,
        quantity: 0,
        selectedBasePrice: 1000,
      }),
    ).toEqual({
      displayPrice: 900,
      selectedBasePrice: 1000,
    });
  });

  it("calculates max quantity from selected variant stock and sale unit size", () => {
    expect(
      resolveProductPurchaseMaxQuantity({
        product: {
          variants: [variant({ attributes: [], stock: 7 })],
        } as ProductWithDetailsDto,
        selectedSaleUnit: saleUnit({ baseQuantity: 3 }),
        selectedVariant: null,
      }),
    ).toBe(2);
  });

  it("falls back to product stock when detailed variants are hidden", () => {
    expect(
      resolveProductPurchaseMaxQuantity({
        product: {
          stock: 5,
          variants: [],
        } as ProductWithDetailsDto,
        selectedSaleUnit: saleUnit({ baseQuantity: 2 }),
        selectedVariant: null,
      }),
    ).toBe(2);
  });

  it("falls back to the product default variant stock when no variant is selected", () => {
    expect(
      resolveProductPurchaseMaxQuantity({
        product: {
          defaultVariantId: "default-variant",
          stock: 99,
          variants: [
            variant({
              id: "default-variant",
              attributes: [],
              stock: 6,
            }),
          ],
        } as ProductWithDetailsDto,
        selectedSaleUnit: saleUnit({ baseQuantity: 4 }),
        selectedVariant: null,
      }),
    ).toBe(1);
  });

  it("does not limit max quantity when stock enforcement is disabled", () => {
    expect(
      resolveProductPurchaseMaxQuantity({
        product: {
          variants: [variant({ attributes: [], stock: 0 })],
        } as ProductWithDetailsDto,
        selectedSaleUnit: saleUnit({ baseQuantity: 3 }),
        selectedVariant: null,
        shouldEnforceStock: false,
      }),
    ).toBeUndefined();
  });

  it("uses cart line max quantity when purchase selection has no stock limit", () => {
    expect(
      resolveProductPurchaseEffectiveMaxQuantity({
        cartLineMaxQuantity: 16,
        purchaseMaxQuantity: undefined,
      }),
    ).toBe(16);
  });

  it("uses the stricter max quantity when both sources are known", () => {
    expect(
      resolveProductPurchaseEffectiveMaxQuantity({
        cartLineMaxQuantity: 16,
        purchaseMaxQuantity: 20,
      }),
    ).toBe(16);
  });

  it("requires a variant only when the selected variant is not purchasable", () => {
    expect(
      isProductVariantSelectionRequired({
        selectableVariants: [variant({ stock: 0 })],
        selectedVariant: variant({ stock: 0 }),
      }),
    ).toBe(true);

    expect(
      isProductVariantSelectionRequired({
        selectableVariants: [variant({ stock: 0 })],
        selectedVariant: variant({ stock: 0 }),
        shouldEnforceStock: false,
      }),
    ).toBe(false);
  });

  it("auto-selects only a single purchasable variant", () => {
    expect(
      resolveSinglePurchasableProductVariantId({
        variants: [
          variant({ id: "available" }),
          variant({ id: "empty", stock: 0 }),
        ],
      }),
    ).toBe("available");

    expect(
      resolveSinglePurchasableProductVariantId({
        variants: [
          variant({ id: "first" }),
          variant({ id: "second" }),
        ],
      }),
    ).toBeNull();
  });

  it("keeps zero display price in cart product snapshot", () => {
    expect(
      buildProductPurchaseCartSnapshot({
        displayPrice: 0,
        product: {
          id: "product-1",
          name: "Gift",
          price: "100",
          slug: "gift",
        } as ProductWithDetailsDto,
      }),
    ).toMatchObject({
      price: "0",
    });
  });

  it("keeps cart product snapshot price empty when product has no price", () => {
    expect(
      buildProductPurchaseCartSnapshot({
        displayPrice: 0,
        product: {
          id: "product-1",
          name: "Gift",
          price: null,
          slug: "gift",
        } as unknown as ProductWithDetailsDto,
      }),
    ).toMatchObject({
      price: null,
    });
  });
});
