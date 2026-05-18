import type { CartDto } from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { createOptimisticCart } from "./cart-optimistic";

function baseCart(overrides: Partial<CartDto> = {}): CartDto {
  const now = "2026-05-13T00:00:00.000Z";

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
    items: [],
    totals: {
      itemsCount: 0,
      subtotal: 0,
      baseSubtotal: 0,
      discountTotal: 0,
      hasDiscount: false,
      total: 0,
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("createOptimisticCart", () => {
  it("creates a cart when adding the first product", () => {
    const cart = createOptimisticCart({
      cart: null,
      catalogId: "catalog-1",
      product: {
        id: "product-1",
        name: "Product",
        price: 120,
        slug: "product",
      },
      productId: "product-1",
      quantity: 2,
    });

    expect(cart?.items).toHaveLength(1);
    expect(cart?.totals.itemsCount).toBe(2);
    expect(cart?.totals.subtotal).toBe(240);
  });

  it("updates the matching variant and sale unit line", () => {
    const cart = createOptimisticCart({
      cart: baseCart({
        items: [
          {
            id: "item-1",
            productId: "product-1",
            variantId: "variant-1",
            saleUnitId: "kg",
            quantity: 1,
            baseQuantity: 1,
            product: {
              id: "product-1",
              name: "Product",
              slug: "product",
              price: 50,
            },
            variant: null,
            saleUnit: null,
            unitPrice: 50,
            baseUnitPrice: 50,
            discountPercent: 0,
            hasDiscount: false,
            lineTotal: 50,
            createdAt: "2026-05-13T00:00:00.000Z",
            updatedAt: "2026-05-13T00:00:00.000Z",
          },
        ],
      }),
      catalogId: "catalog-1",
      productId: "product-1",
      quantity: 3,
      saleUnitId: "kg",
      variantId: "variant-1",
    });

    expect(cart?.items[0]?.quantity).toBe(3);
    expect(cart?.items[0]?.lineTotal).toBe(150);
    expect(cart?.totals.itemsCount).toBe(3);
  });

  it("keeps the existing line price when cart controls do not pass a product snapshot", () => {
    const cart = createOptimisticCart({
      cart: baseCart({
        items: [
          {
            id: "item-1",
            productId: "product-1",
            variantId: null,
            saleUnitId: null,
            quantity: 6,
            baseQuantity: 6,
            product: {
              id: "product-1",
              name: "Product",
              slug: "product",
              price: null,
            },
            variant: null,
            saleUnit: null,
            unitPrice: 120,
            baseUnitPrice: 120,
            discountPercent: 0,
            hasDiscount: false,
            lineTotal: 720,
            createdAt: "2026-05-13T00:00:00.000Z",
            updatedAt: "2026-05-13T00:00:00.000Z",
          },
        ],
      }),
      catalogId: "catalog-1",
      productId: "product-1",
      quantity: 7,
    });

    expect(cart?.items[0]?.quantity).toBe(7);
    expect(cart?.items[0]?.lineTotal).toBe(840);
    expect(cart?.totals.subtotal).toBe(840);
  });

  it("removes a line when quantity reaches zero", () => {
    const cart = createOptimisticCart({
      cart: baseCart({
        items: [
          {
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
              price: 50,
            },
            variant: null,
            saleUnit: null,
            unitPrice: 50,
            baseUnitPrice: 50,
            discountPercent: 0,
            hasDiscount: false,
            lineTotal: 50,
            createdAt: "2026-05-13T00:00:00.000Z",
            updatedAt: "2026-05-13T00:00:00.000Z",
          },
        ],
      }),
      catalogId: "catalog-1",
      productId: "product-1",
      quantity: 0,
    });

    expect(cart?.items).toHaveLength(0);
    expect(cart?.totals.itemsCount).toBe(0);
    expect(cart?.totals.subtotal).toBe(0);
  });
});
