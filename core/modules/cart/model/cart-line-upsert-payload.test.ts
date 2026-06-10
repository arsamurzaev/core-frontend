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
          guestName: " Guest ",
          guestSessionId: " guest-1 ",
          productId: " product-1 ",
          saleUnitId: " kg ",
          variantId: " variant-1 ",
        },
      }),
    ).toEqual({
      guestName: "Guest",
      guestSessionId: "guest-1",
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

  it("finds a sale unit line when variants are hidden from the cart", () => {
    const item = cartItem({
      id: "box-item",
      saleUnitId: "box",
      variantId: null,
    });

    expect(
      findCartItemForLineSelection([item], {
        productId: "product-1",
        saleUnitId: "box",
      })?.id,
    ).toBe("box-item");
    expect(
      buildCartLineUpsertPayload({
        cartItem: item,
        quantity: 5,
        selection: {
          productId: "product-1",
          saleUnitId: "box",
        },
      }),
    ).toEqual({
      productId: "product-1",
      quantity: 5,
      saleUnitId: "box",
    });
  });

  it("keeps modifiers when building a payload for a modifier line", () => {
    const modifiers = [
      {
        productModifierGroupId: "group-1",
        productModifierOptionId: "option-1",
        quantity: 2,
      },
    ];
    const item = {
      ...cartItem({
        id: "cheese-item",
      }),
      modifiers: [
        {
          id: "cart-modifier-1",
          productModifierGroupId: "group-1",
          productModifierOptionId: "option-1",
          groupName: "Добавки",
          optionName: "Сыр",
          quantity: 2,
          unitPrice: 50,
        },
      ],
    } as CartItemDto;

    expect(
      findCartItemForLineSelection([item], {
        modifiers,
        productId: "product-1",
      })?.id,
    ).toBe("cheese-item");
    expect(
      buildCartLineUpsertPayload({
        cartItem: item,
        quantity: 3,
        selection: {
          modifiers,
          productId: "product-1",
        },
      }),
    ).toEqual({
      modifiers,
      productId: "product-1",
      quantity: 3,
    });
  });

  it("finds a line in the selected guest scope", () => {
    const items = [
      cartItem({
        id: "guest-1-item",
        guestSessionId: "guest-1",
        quantity: 2,
      }),
      cartItem({
        id: "guest-2-item",
        guestSessionId: "guest-2",
        quantity: 3,
      }),
    ];

    expect(
      findCartItemForLineSelection(items, {
        guestSessionId: "guest-2",
        productId: "product-1",
      })?.id,
    ).toBe("guest-2-item");
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
