import {
  AuthUserDtoRole,
  ProductWithDetailsDtoStatus,
  type ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import {
  isProductPubliclyAvailable,
  shouldHideProductFromCustomer,
} from "./product-availability";

function product(status: ProductWithDetailsDtoStatus): ProductWithDetailsDto {
  return {
    id: "product-1",
    sku: "SKU-1",
    name: "Product",
    slug: "product",
    price: "1000",
    media: [],
    brand: null,
    productType: null,
    categories: [],
    integration: null,
    isPopular: false,
    status,
    position: 0,
    createdAt: "2026-05-14T00:00:00.000Z",
    updatedAt: "2026-05-14T00:00:00.000Z",
    productAttributes: [],
    variantSummary: {
      activeCount: 0,
      maxPrice: null,
      minPrice: null,
      singleVariantId: null,
      totalStock: 0,
    },
    variantPickerOptions: [],
    variants: [],
    seo: null,
  };
}

describe("product availability", () => {
  it("keeps active products public", () => {
    expect(
      isProductPubliclyAvailable(product(ProductWithDetailsDtoStatus.ACTIVE)),
    ).toBe(true);
  });

  it("hides non-active products from customers", () => {
    expect(
      shouldHideProductFromCustomer({
        product: product(ProductWithDetailsDtoStatus.HIDDEN),
        userRole: null,
      }),
    ).toBe(true);
  });

  it("keeps hidden products visible for catalog managers", () => {
    expect(
      shouldHideProductFromCustomer({
        product: product(ProductWithDetailsDtoStatus.HIDDEN),
        userRole: AuthUserDtoRole.CATALOG,
      }),
    ).toBe(false);
  });
});
