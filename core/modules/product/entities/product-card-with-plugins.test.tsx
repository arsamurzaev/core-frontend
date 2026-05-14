import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const productCardProps = vi.hoisted(
  () => [] as Array<Record<string, unknown>>,
);

vi.mock("@/shared/providers/catalog-provider", () => ({
  useCatalogState: () => ({
    catalog: {
      type: {
        attributes: [],
      },
    },
  }),
}));

vi.mock("./product-card", () => ({
  ProductCard: (props: Record<string, unknown>) => {
    productCardProps.push(props);
    return null;
  },
}));

import { ProductCardWithPlugins } from "./product-card-with-plugins";

function product(overrides: Partial<ProductWithAttributesDto> = {}) {
  return {
    brand: null,
    categories: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    id: "product-1",
    integration: null,
    isPopular: false,
    media: [],
    name: "Test product",
    position: 0,
    price: "10000",
    productAttributes: [],
    productType: null,
    sku: null,
    slug: "test-product",
    status: "ACTIVE",
    updatedAt: "2026-01-01T00:00:00.000Z",
    variantPickerOptions: [],
    variantSummary: null,
    ...overrides,
  } as ProductWithAttributesDto;
}

describe("ProductCardWithPlugins", () => {
  beforeEach(() => {
    productCardProps.length = 0;
  });

  it("forwards the footer price hiding flag to the base product card", () => {
    renderToStaticMarkup(
      <ProductCardWithPlugins
        data={product()}
        footerAction={<span>Footer action</span>}
        hidePriceWhenFooterAction
      />,
    );

    expect(productCardProps).toHaveLength(1);
    expect(productCardProps[0]).toMatchObject({
      hidePriceWhenFooterAction: true,
    });
  });
});
