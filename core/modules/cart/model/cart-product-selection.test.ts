import {
  ProductVariantPickerOptionDtoStatus,
  type ProductVariantPickerOptionDto,
  type ProductWithAttributesDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import {
  buildCartProductSelection,
  buildCartProductSelectionFromVariantOption,
  buildCartProductVariantSnapshot,
  resolveCartProductCardSelection,
} from "./cart-product-selection";

function option(
  overrides: Partial<ProductVariantPickerOptionDto> = {},
): ProductVariantPickerOptionDto {
  return {
    id: "variant-1",
    isAvailable: true,
    label: "42",
    maxQuantity: 5,
    price: "1000",
    saleUnitId: null,
    saleUnitPrice: null,
    status: ProductVariantPickerOptionDtoStatus.ACTIVE,
    stock: 5,
    ...overrides,
  };
}

function product(
  overrides: Partial<ProductWithAttributesDto> = {},
): ProductWithAttributesDto {
  return {
    id: "product-1",
    name: "Product",
    price: "900",
    slug: "product",
    variantPickerOptions: [],
    ...overrides,
  } as ProductWithAttributesDto;
}

describe("cart product selection", () => {
  it("normalizes product, variant and sale unit ids for cart payloads", () => {
    expect(
      buildCartProductSelection({
        productId: " product-1 ",
        saleUnitId: " box ",
        variantId: " variant-1 ",
      }),
    ).toEqual({
      productId: "product-1",
      saleUnitId: "box",
      variantId: "variant-1",
    });
  });

  it("keeps sale unit selection from variant picker options", () => {
    expect(
      buildCartProductSelectionFromVariantOption({
        productId: "product-1",
        option: option({
          id: "variant-1",
          saleUnitId: "box",
        }),
      }),
    ).toEqual({
      productId: "product-1",
      saleUnitId: "box",
      variantId: "variant-1",
    });
  });

  it("resolves card single variant selection with its sale unit when backend provides it", () => {
    expect(
      resolveCartProductCardSelection({
        product: product({
          variantPickerOptions: [
            option({
              id: "variant-1",
              saleUnitId: "box",
            }),
          ],
        }),
        variantId: "variant-1",
      }),
    ).toEqual({
      productId: "product-1",
      saleUnitId: "box",
      variantId: "variant-1",
    });
  });

  it("uses sale unit price before variant and product price in optimistic cart snapshot", () => {
    expect(
      buildCartProductVariantSnapshot(
        product({ price: "900" }),
        option({
          price: "1000",
          saleUnitPrice: "1200",
        }),
      ),
    ).toMatchObject({
      price: "1200",
    });
  });
});
