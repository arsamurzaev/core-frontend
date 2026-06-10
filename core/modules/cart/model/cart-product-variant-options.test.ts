import {
  ProductVariantPickerOptionDtoStatus,
  type ProductVariantPickerOptionDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import {
  getCartProductVariantPickerItems,
  getCartProductVariantPickerOptions,
} from "./cart-product-variant-options";

function option(
  overrides: Partial<ProductVariantPickerOptionDto> = {},
): ProductVariantPickerOptionDto {
  return {
    id: "variant-1",
    isAvailable: true,
    label: "42",
    maxQuantity: 4,
    price: "1000",
    saleUnitId: null,
    saleUnitPrice: null,
    status: ProductVariantPickerOptionDtoStatus.ACTIVE,
    stock: 4,
    ...overrides,
  };
}

describe("cart product variant options", () => {
  it("uses card picker options directly", () => {
    expect(
      getCartProductVariantPickerOptions({
        product: {
          variantPickerOptions: [option({ id: "card-variant" })],
        },
        shouldEnforceStock: true,
      }).map((item) => item.id),
    ).toEqual(["card-variant"]);
  });

  it("filters unavailable stock from card picker options", () => {
    expect(
      getCartProductVariantPickerOptions({
        product: {
          variantPickerOptions: [
            option({ id: "available" }),
            option({
              id: "empty",
              isAvailable: false,
              status: ProductVariantPickerOptionDtoStatus.OUT_OF_STOCK,
              stock: 0,
            }),
          ],
        },
        shouldEnforceStock: true,
      }).map((item) => item.id),
    ).toEqual(["available"]);
  });

  it("filters options without active price-list prices", () => {
    expect(
      getCartProductVariantPickerOptions({
        product: {
          usesPriceList: true,
          variantPickerOptions: [
            option({ id: "priced", price: "350.00" }),
            option({ id: "missing-price", price: null }),
          ],
        },
        shouldEnforceStock: true,
      }).map((item) => item.id),
    ).toEqual(["priced"]);
  });

  it("keeps unavailable options in drawer items with a disabled reason", () => {
    const items = getCartProductVariantPickerItems({
      product: {
        variantPickerOptions: [
          option({ id: "available" }),
          option({
            id: "disabled",
            status: ProductVariantPickerOptionDtoStatus.DISABLED,
          }),
          option({
            id: "empty",
            isAvailable: false,
            status: ProductVariantPickerOptionDtoStatus.OUT_OF_STOCK,
            stock: 0,
          }),
        ],
      },
      shouldEnforceStock: true,
    });

    expect(
      items.map((item) => ({
        id: item.option.id,
        isSelectable: item.availability.isSelectable,
        reason: item.availability.reason,
      })),
    ).toEqual([
      { id: "available", isSelectable: true, reason: null },
      { id: "disabled", isSelectable: false, reason: "disabled" },
      { id: "empty", isSelectable: false, reason: "out_of_stock" },
    ]);
  });

  it("keeps null stock picker options purchasable when stock is enforced", () => {
    expect(
      getCartProductVariantPickerOptions({
        product: {
          variantPickerOptions: [
            option({
              id: "untracked",
              maxQuantity: null,
              stock: null,
            }),
          ],
        },
        shouldEnforceStock: true,
      }).map((item) => item.id),
    ).toEqual(["untracked"]);
  });

  it("does not invent picker options when the card payload has none", () => {
    expect(
      getCartProductVariantPickerOptions({
        product: {
          variantPickerOptions: [],
        },
        shouldEnforceStock: true,
      }),
    ).toEqual([]);
  });
});
