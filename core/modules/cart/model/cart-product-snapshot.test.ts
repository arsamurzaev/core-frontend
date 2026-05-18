import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { buildCartProductCardSnapshot } from "./cart-product-snapshot";

const NOW = "2026-05-14T00:00:00.000Z";

function product(
  overrides: Partial<ProductWithAttributesDto> = {},
): ProductWithAttributesDto {
  return {
    id: "product-1",
    sku: "SKU",
    name: "Sneakers",
    slug: "sneakers",
    price: null,
    media: [],
    brand: null,
    productType: {
      id: "type-1",
      code: "size",
      name: "Размер",
    },
    categories: [],
    integration: null,
    isPopular: false,
    status: "ACTIVE",
    position: 0,
    createdAt: NOW,
    updatedAt: NOW,
    productAttributes: [],
    variantSummary: {
      minPrice: "12000",
      maxPrice: "12000",
      activeCount: 1,
      totalStock: 3,
      singleVariantId: "variant-1",
    },
    variantPickerOptions: [],
    ...overrides,
  };
}

describe("buildCartProductCardSnapshot", () => {
  it("uses the card display price for variant-only products", () => {
    const snapshot = buildCartProductCardSnapshot(product(), {
      canUseVariants: true,
      fallbackCurrency: "RUB",
    });

    expect(snapshot.price).toBe("12000");
    expect(snapshot.variantSummary?.singleVariantId).toBe("variant-1");
  });

  it("falls back to the product price for regular products", () => {
    const snapshot = buildCartProductCardSnapshot(
      product({
        price: "5000",
        productType: null,
        variantSummary: {
          minPrice: null,
          maxPrice: null,
          activeCount: 0,
          totalStock: 0,
          singleVariantId: null,
        },
      }),
      { canUseVariants: true, fallbackCurrency: "RUB" },
    );

    expect(snapshot.price).toBe("5000");
  });
});
