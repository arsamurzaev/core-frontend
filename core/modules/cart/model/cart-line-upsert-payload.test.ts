import type { CartItemDto } from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import {
  buildCartLineUpsertPayload,
  findCartItemForLineSelection,
} from "./cart-line-upsert-payload";

const NOW = "2026-05-13T00:00:00.000Z";

function cartItem(overrides: Partial<CartItemDto> = {}): CartItemDto {
  const productId = overrides.productId ?? "product-1";

  return {
    id: "item-1",
    productId,
    variantId: null,
    saleUnitId: null,
    quantity: 1,
    baseQuantity: 1,
    product: {
      id: productId,
      name: "Product",
      slug: "product",
      price: 100,
    },
    variant: null,
    saleUnit: null,
    unitPrice: 100,
    baseUnitPrice: 100,
    discountPercent: 0,
    hasDiscount: false,
    lineTotal: 100,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("cart line upsert payload", () => {
  it("normalizes selection and keeps variant and sale unit ids", () => {
    expect(
      buildCartLineUpsertPayload({
        quantity: 3,
        selection: {
          productId: " product-1 ",
          saleUnitId: " kg ",
          variantId: " variant-1 ",
        },
      }),
    ).toEqual({
      productId: "product-1",
      quantity: 3,
      saleUnitId: "kg",
      variantId: "variant-1",
    });
  });

  it("falls back to the existing cart item line when selection omits line ids", () => {
    expect(
      buildCartLineUpsertPayload({
        cartItem: cartItem({
          saleUnitId: "box",
          variantId: "variant-2",
        }),
        quantity: 4,
        selection: {
          productId: "product-1",
        },
      }),
    ).toEqual({
      productId: "product-1",
      quantity: 4,
      saleUnitId: "box",
      variantId: "variant-2",
    });
  });

  it("finds an exact variant and sale unit line", () => {
    const items = [
      cartItem({
        id: "default-item",
      }),
      cartItem({
        id: "kg-item",
        saleUnitId: "kg",
        variantId: "variant-1",
      }),
    ];

    expect(
      findCartItemForLineSelection(items, {
        productId: "product-1",
        saleUnitId: "kg",
        variantId: "variant-1",
      })?.id,
    ).toBe("kg-item");
  });

  it("prefers the default product line for legacy product-only calls", () => {
    const items = [
      cartItem({
        id: "sale-unit-item",
        saleUnitId: "kg",
      }),
      cartItem({
        id: "default-item",
      }),
    ];

    expect(
      findCartItemForLineSelection(items, {
        productId: "product-1",
      })?.id,
    ).toBe("default-item");
  });
});
