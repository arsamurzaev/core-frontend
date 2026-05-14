import type {
  CartItemDto,
  ProductVariantDto,
  ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { buildCartItemView } from "./cart-item-view";

const NOW = "2026-05-13T00:00:00.000Z";

function cartItem(overrides: Partial<CartItemDto> = {}): CartItemDto {
  return {
    id: "item-1",
    productId: "product-1",
    variantId: null,
    saleUnitId: null,
    quantity: 2,
    baseQuantity: 2,
    product: {
      id: "product-1",
      name: "Coffee",
      slug: "coffee",
      price: 100,
    },
    variant: null,
    saleUnit: null,
    unitPrice: 100,
    baseUnitPrice: 100,
    discountPercent: 0,
    hasDiscount: false,
    lineTotal: 200,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
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

function product(
  overrides: Partial<ProductWithDetailsDto> = {},
): ProductWithDetailsDto {
  return {
    id: "product-1",
    sku: "SKU",
    name: "Coffee",
    slug: "coffee",
    price: "100",
    media: [],
    brand: null,
    productType: null,
    categories: [],
    integration: null,
    isPopular: false,
    status: "ACTIVE",
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

describe("buildCartItemView", () => {
  it("keeps backend line total for variant lines even when variant snapshot is missing", () => {
    const view = buildCartItemView({
      fallbackCurrency: "RUB",
      item: cartItem({
        variantId: "variant-1",
        variant: null,
        lineTotal: 240,
      }),
      product: product({
        price: "100",
      }),
    });

    expect(view.displayLineTotal).toBe(240);
    expect(view.originalLineTotal).toBe(240);
  });

  it("keeps cart totals unknown when product price is absent", () => {
    const view = buildCartItemView({
      fallbackCurrency: "RUB",
      item: cartItem({
        lineTotal: 0,
        product: {
          id: "product-1",
          name: "Coffee",
          slug: "coffee",
          price: null,
        },
      }),
    });

    expect(view.displayLineTotal).toBeNull();
    expect(view.originalLineTotal).toBeNull();
  });

  it("keeps a positive line total even when product price snapshot is absent", () => {
    const view = buildCartItemView({
      fallbackCurrency: "RUB",
      item: cartItem({
        lineTotal: 240,
        product: {
          id: "product-1",
          name: "Coffee",
          slug: "coffee",
          price: null,
        },
      }),
    });

    expect(view.displayLineTotal).toBe(240);
    expect(view.originalLineTotal).toBe(240);
  });

  it("resolves sale unit label from product variant sale units", () => {
    const view = buildCartItemView({
      fallbackCurrency: "RUB",
      item: cartItem({
        variantId: "variant-1",
        saleUnitId: "box",
        lineTotal: 240,
      }),
      product: product({
        variants: [
          variant({
            saleUnits: [
              {
                id: "box",
                catalogSaleUnitId: null,
                code: "box",
                name: "Box",
                baseQuantity: "12",
                price: "120",
                barcode: null,
                isDefault: true,
                isActive: true,
                displayOrder: 0,
                createdAt: NOW,
                updatedAt: NOW,
                catalogSaleUnit: null,
              },
            ],
          }),
        ],
      }),
    });

    expect(view.saleUnitId).toBe("box");
    expect(view.saleUnitLabel).toContain("Box");
    expect(view.saleUnitLabel).toContain("12");
    expect(view.subtitle).toContain("Box");
  });
});
