import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { buildProductCardView } from "./product-card-view";

function product(
  overrides: Partial<ProductWithAttributesDto> = {},
): ProductWithAttributesDto {
  return {
    id: "product-1",
    sku: "sku-1",
    name: "Test product",
    slug: "test-product",
    price: "1000.00",
    priceState: "KNOWN",
    displayPrice: "1000.00",
    minPrice: "1000.00",
    maxPrice: "1000.00",
    availabilityState: "AVAILABLE",
    stock: 1,
    defaultVariantId: "default-variant",
    saleUnits: [],
    requiresVariantSelection: false,
    media: [],
    brand: null,
    productType: {
      id: "type-1",
      code: "type",
      name: "Type",
    },
    categories: [],
    integration: null,
    isPopular: false,
    status: "ACTIVE",
    position: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    productAttributes: [],
    variantSummary: {
      minPrice: null,
      maxPrice: null,
      activeCount: 0,
      totalStock: 0,
      singleVariantId: null,
    },
    variantPickerOptions: [],
    ...overrides,
  };
}

describe("buildProductCardView", () => {
  it("prefers the card image variant and keeps the original image as fallback", () => {
    const view = buildProductCardView(
      product({
        media: [
          {
            position: 2,
            kind: null,
            media: {
              id: "media-2",
              originalName: "second.jpg",
              mimeType: "image/jpeg",
              size: null,
              width: null,
              height: null,
              status: "READY",
              key: "second",
              url: "/images/second-original.jpg",
              variants: [
                {
                  id: "media-2-thumb",
                  kind: "thumb-webp",
                  mimeType: "image/webp",
                  size: null,
                  width: null,
                  height: null,
                  key: "second-thumb",
                  url: "/images/second-thumb.webp",
                },
              ],
            },
          },
          {
            position: 1,
            kind: null,
            media: {
              id: "media-1",
              originalName: "first.jpg",
              mimeType: "image/jpeg",
              size: null,
              width: null,
              height: null,
              status: "READY",
              key: "first",
              url: "/images/first-original.jpg",
              variants: [
                {
                  id: "media-1-thumb",
                  kind: "thumb-webp",
                  mimeType: "image/webp",
                  size: null,
                  width: null,
                  height: null,
                  key: "first-thumb",
                  url: "/images/first-thumb.webp",
                },
                {
                  id: "media-1-card",
                  kind: "card-webp",
                  mimeType: "image/webp",
                  size: null,
                  width: null,
                  height: null,
                  key: "first-card",
                  url: "/images/first-card.webp",
                },
              ],
            },
          },
        ],
      }),
    );

    expect(view.imageUrl).toBe("/images/first-card.webp");
    expect(view.imageFallbackUrl).toBe("/images/first-original.jpg");
  });

  it("falls back to the original image when card variants are absent", () => {
    const view = buildProductCardView(
      product({
        media: [
          {
            position: 1,
            kind: null,
            media: {
              id: "media-1",
              originalName: "first.jpg",
              mimeType: "image/jpeg",
              size: null,
              width: null,
              height: null,
              status: "READY",
              key: "first",
              url: "/images/first-original.jpg",
              variants: [],
            },
          },
        ],
      }),
    );

    expect(view.imageUrl).toBe("/images/first-original.jpg");
    expect(view.imageFallbackUrl).toBe("/images/first-original.jpg");
  });

  it("uses the commercial range instead of legacy product price", () => {
    const view = buildProductCardView(
      product({
        price: "5000.00",
        priceState: "RANGE",
        displayPrice: "1200.00",
        minPrice: "1200.00",
        maxPrice: "1800.00",
        requiresVariantSelection: true,
      }),
      { canUseVariants: true },
    );

    expect(view.price).toBe(1200);
    expect(view.displayPrice).toBe(1200);
    expect(view.pricePrefix).toBe("от");
  });

  it("hides a legacy product price when commercial price is unknown", () => {
    const view = buildProductCardView(
      product({
        price: "5000.00",
        priceState: "UNKNOWN",
        displayPrice: null,
        minPrice: null,
        maxPrice: null,
        requiresVariantSelection: true,
      }),
      { canUseVariants: true },
    );

    expect(view.price).toBeUndefined();
    expect(view.displayPrice).toBeUndefined();
    expect(view.pricePrefix).toBeNull();
  });

  it("uses variant pricing even when product type is hidden", () => {
    const view = buildProductCardView(
      product({
        price: "5000.00",
        priceState: undefined,
        displayPrice: null,
        minPrice: null,
        maxPrice: null,
        productType: null,
        requiresVariantSelection: true,
        variantSummary: {
          activeCount: 2,
          maxPrice: "2000.00",
          minPrice: "1500.00",
          singleVariantId: null,
          totalStock: null,
        },
      }),
      { canUseVariants: true },
    );

    expect(view.price).toBe(1500);
    expect(view.displayPrice).toBe(1500);
    expect(view.pricePrefix).toBe("от");
  });

  it("keeps an explicit zero variant price as a known price", () => {
    const view = buildProductCardView(
      product({
        price: null,
        priceState: undefined,
        displayPrice: null,
        minPrice: null,
        maxPrice: null,
        requiresVariantSelection: true,
        variantSummary: {
          activeCount: 1,
          maxPrice: "0",
          minPrice: "0",
          singleVariantId: "variant-1",
          totalStock: null,
        },
      }),
      { canUseVariants: true },
    );

    expect(view.price).toBe(0);
    expect(view.displayPrice).toBe(0);
    expect(view.pricePrefix).toBeNull();
  });

  it("shows active sale units in card summary", () => {
    const view = buildProductCardView(
      product({
        saleUnits: [
          {
            id: "piece",
            catalogSaleUnitId: "catalog-piece",
            code: "piece",
            name: "piece",
            baseQuantity: "1",
            price: "1000.00",
            barcode: null,
            isDefault: true,
            isActive: true,
            displayOrder: 0,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            catalogSaleUnit: null,
          },
          {
            id: "box",
            catalogSaleUnitId: "catalog-box",
            code: "box",
            name: "box",
            baseQuantity: "20",
            price: "18000.00",
            barcode: null,
            isDefault: false,
            isActive: true,
            displayOrder: 1,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            catalogSaleUnit: null,
          },
        ],
      }),
    );

    expect(view.saleUnitsSummary).toBe("piece / box");
  });
});
