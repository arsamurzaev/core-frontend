import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import type {
  ProductVariantDto,
  ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { getCartItemMaxQuantity } from "./cart-item-max-quantity";

const NOW = "2026-05-13T00:00:00.000Z";

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

function cartItemView(overrides: Partial<CartItemView> = {}): CartItemView {
  return {
    id: "item-1",
    productId: "product-1",
    productSlug: "coffee",
    product: product(),
    name: "Coffee",
    imageUrl: "/not-found-photo.png",
    quantity: 1,
    currency: "RUB",
    displayLineTotal: 100,
    originalLineTotal: 100,
    hasDiscount: false,
    saleUnitId: null,
    saleUnitLabel: null,
    subtitle: "",
    variantId: null,
    variantLabel: null,
    ...overrides,
  };
}

describe("getCartItemMaxQuantity", () => {
  it("calculates max line quantity from variant stock and sale unit base quantity", () => {
    expect(
      getCartItemMaxQuantity(
        cartItemView({
          variantId: "variant-1",
          saleUnitId: "box",
          product: product({
            variants: [
              variant({
                stock: 9,
                saleUnits: [
                  {
                    id: "box",
                    catalogSaleUnitId: null,
                    code: "box",
                    name: "Box",
                    baseQuantity: "4",
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
        }),
      ),
    ).toBe(2);
  });

  it("does not enforce stock while product details are unavailable", () => {
    expect(getCartItemMaxQuantity(cartItemView({ product: undefined }))).toBeUndefined();
  });
});
