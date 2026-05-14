import type { CartDto, CartItemDto } from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { getCartLineSelectionQuantityFromCart } from "./cart-quantity-from-cart";

function cartItem(overrides: Partial<CartItemDto>): CartItemDto {
  return {
    id: "item-1",
    productId: "product-1",
    variantId: null,
    saleUnitId: null,
    quantity: 1,
    baseQuantity: 1,
    product: {
      id: "product-1",
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
    createdAt: "2026-05-14T00:00:00.000Z",
    updatedAt: "2026-05-14T00:00:00.000Z",
    ...overrides,
  };
}

function cart(items: CartItemDto[]): CartDto {
  const now = "2026-05-14T00:00:00.000Z";

  return {
    id: "cart-1",
    catalogId: "catalog-1",
    status: "DRAFT",
    statusMessage: null,
    statusChangedAt: now,
    publicKey: null,
    checkoutAt: null,
    checkoutMethod: null,
    checkoutData: null,
    checkoutContacts: null,
    comment: null,
    assignedManagerId: null,
    managerSessionStartedAt: null,
    managerLastSeenAt: null,
    closedAt: null,
    items,
    totals: {
      itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: 0,
      baseSubtotal: 0,
      discountTotal: 0,
      hasDiscount: false,
      total: 0,
    },
    createdAt: now,
    updatedAt: now,
  };
}

describe("getCartLineSelectionQuantityFromCart", () => {
  it("returns product total for product-level selection", () => {
    const value = getCartLineSelectionQuantityFromCart({
      cart: cart([
        cartItem({ id: "item-1", quantity: 2 }),
        cartItem({ id: "item-2", quantity: 3, variantId: "variant-1" }),
      ]),
      selection: { productId: "product-1" },
    });

    expect(value).toBe(5);
  });

  it("returns exact line quantity for variant or sale unit selection", () => {
    const value = getCartLineSelectionQuantityFromCart({
      cart: cart([
        cartItem({ id: "item-1", quantity: 2, variantId: "variant-1" }),
        cartItem({ id: "item-2", quantity: 3, variantId: "variant-2" }),
      ]),
      selection: { productId: "product-1", variantId: "variant-2" },
    });

    expect(value).toBe(3);
  });
});
