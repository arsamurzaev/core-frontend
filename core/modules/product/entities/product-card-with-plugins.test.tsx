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

  it("forwards image loading mode to the base product card", () => {
    renderToStaticMarkup(
      <ProductCardWithPlugins data={product()} imageLoading="eager" />,
    );

    expect(productCardProps).toHaveLength(1);
    expect(productCardProps[0]).toMatchObject({
      imageLoading: "eager",
    });
  });

  it("passes variant summary to the card header without rendering a plugin label", () => {
    const markup = renderToStaticMarkup(
      <ProductCardWithPlugins
        data={product({
          productType: {
            id: "type-1",
            code: "clothes",
            name: "Clothes",
          },
          variantPickerOptions: [
            {
              id: "variant-1",
              isAvailable: true,
              label: "Хаки, L",
              maxQuantity: null,
              price: "3990",
              saleUnitId: null,
              saleUnitPrice: null,
              status: "ACTIVE",
              stock: 1,
            },
          ],
        })}
      />,
    );

    expect(productCardProps).toHaveLength(1);
    expect(productCardProps[0]).toMatchObject({
      headerMeta: "Хаки, L",
    });
    expect(markup).not.toContain("Вариации");
  });

  it("passes variant summary to the card header when product type is absent", () => {
    renderToStaticMarkup(
      <ProductCardWithPlugins
        data={product({
          productType: null,
          variantPickerOptions: [
            {
              id: "variant-1",
              isAvailable: true,
              label: "Red",
              maxQuantity: null,
              price: "690",
              saleUnitId: null,
              saleUnitPrice: null,
              status: "ACTIVE",
              stock: 1,
            },
          ],
        })}
      />,
    );

    expect(productCardProps).toHaveLength(1);
    expect(productCardProps[0]).toMatchObject({
      headerMeta: "Red",
    });
  });
});
