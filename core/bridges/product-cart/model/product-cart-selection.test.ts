import type { CartItemView } from "@/core/modules/cart";
import type { ProductWithDetailsDto } from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import {
  buildProductCartSelection,
  findProductCartLineBySelection,
  getProductCartLineMaxQuantity,
} from "./product-cart-selection";

function cartItem(overrides: Partial<CartItemView> = {}): CartItemView {
  return {
    currency: "RUB",
    displayLineTotal: 100,
    hasDiscount: false,
    id: "line-1",
    imageUrl: "/not-found-photo.png",
    name: "Coffee",
    originalLineTotal: 100,
    product: {
      defaultVariantId: null,
      saleUnits: [],
      stock: 5,
      variants: [],
    } as unknown as ProductWithDetailsDto,
    productId: "product-1",
    productSlug: "coffee",
    quantity: 1,
    saleUnitId: null,
    saleUnitLabel: null,
    subtitle: "",
    variantId: null,
    variantLabel: null,
    ...overrides,
  };
}

describe("product cart bridge selection", () => {
  it("builds a normalized cart selection for a product purchase", () => {
    expect(
      buildProductCartSelection({
        modifiers: [
          {
            productModifierGroupId: " group-1 ",
            productModifierOptionId: " option-1 ",
            quantity: 2,
          },
        ],
        productId: " product-1 ",
        saleUnitId: " box ",
        variantId: " variant-1 ",
      }),
    ).toMatchObject({
      modifierSignature: "group-1:option-1x2",
      productId: "product-1",
      saleUnitId: "box",
      variantId: "variant-1",
    });
  });

  it("finds the matching cart line by product, variant, sale unit and modifiers", () => {
    const target = cartItem({
      id: "target",
      modifiers: [
        {
          productModifierGroupId: "group-1",
          productModifierOptionId: "option-1",
          quantity: 2,
        },
      ],
      saleUnitId: "box",
      variantId: "variant-1",
    });

    expect(
      findProductCartLineBySelection({
        items: [
          cartItem({
            id: "other",
            saleUnitId: "piece",
            variantId: "variant-1",
          }),
          target,
        ],
        selection: buildProductCartSelection({
          modifiers: [
            {
              productModifierGroupId: "group-1",
              productModifierOptionId: "option-1",
              quantity: 2,
            },
          ],
          productId: "product-1",
          saleUnitId: "box",
          variantId: "variant-1",
        }),
      }),
    ).toBe(target);
  });

  it("returns the matched cart line max quantity unless selection is incomplete", () => {
    const selection = buildProductCartSelection({
      productId: "product-1",
    });

    expect(
      getProductCartLineMaxQuantity({
        items: [cartItem()],
        selection,
      }),
    ).toBe(5);

    expect(
      getProductCartLineMaxQuantity({
        isSelectionRequired: true,
        items: [cartItem()],
        selection,
      }),
    ).toBeUndefined();
  });
});
