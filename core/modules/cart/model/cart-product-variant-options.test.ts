import {
  ProductVariantPickerOptionDtoStatus,
  type ProductVariantPickerOptionDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { getCartProductVariantPickerOptions } from "./cart-product-variant-options";

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
