import type {
  CartItemDto,
  ProductVariantDto,
  ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { buildCartItemView } from "./cart-item-view";

const NOW = "2026-05-13T00:00:00.000Z";

function cartItem(
  overrides: Partial<
    CartItemDto & {
      priceListId?: string | null;
      unitPriceSnapshot?: number | string | null;
    }
  > = {},
): CartItemDto {
  return {
    id: "item-1",
    productId: "product-1",
    variantId: null,
    saleUnitId: null,
    quantity: 2,
    baseQuantity: 2,
    product: {
      id: "product-1",
      name: "Coffee",
      slug: "coffee",
      price: 100,
    },
    variant: null,
    saleUnit: null,
    unitPrice: 100,
    baseUnitPrice: 100,
    discountPercent: 0,
    hasDiscount: false,
    lineTotal: 200,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function variant(
  overrides: Partial<ProductVariantDto> = {},
): ProductVariantDto {
  return {
    id: "variant-1",
    sku: "SKU-1",
    variantKey: "base",
    kind: "DEFAULT",
    stock: 10,
    price: "100",
    status: "ACTIVE",
    isAvailable: true,
    createdAt: NOW,
    updatedAt: NOW,
    attributes: [],
    saleUnits: [],
    ...overrides,
  };
}

function product(
  overrides: Partial<ProductWithDetailsDto> = {},
): ProductWithDetailsDto {
  return {
    id: "product-1",
    sku: "SKU",
    name: "Coffee",
    slug: "coffee",
    price: "100",
    priceState: "KNOWN",
    displayPrice: "100",
    minPrice: "100",
    maxPrice: "100",
    availabilityState: "AVAILABLE",
    stock: 10,
    defaultVariantId: null,
    saleUnits: [],
    requiresVariantSelection: false,
    media: [],
    brand: null,
    productType: null,
    categories: [],
    integration: null,
    isPopular: false,
    status: "ACTIVE",
    position: 0,
    createdAt: NOW,
    updatedAt: NOW,
    productAttributes: [],
    variantSummary: {
      minPrice: null,
      maxPrice: null,
      activeCount: 0,
      totalStock: 0,
      singleVariantId: null,
    },
    variantPickerOptions: [],
    variants: [],
    seo: null,
    ...overrides,
  };
}

describe("buildCartItemView", () => {
  it("keeps backend line total for variant lines even when variant snapshot is missing", () => {
    const view = buildCartItemView({
      fallbackCurrency: "RUB",
      item: cartItem({
        variantId: "variant-1",
        variant: null,
        lineTotal: 240,
      }),
      product: product({
        price: "100",
      }),
    });

    expect(view.displayLineTotal).toBe(240);
    expect(view.originalLineTotal).toBe(240);
  });

  it("keeps cart totals unknown when product price is absent", () => {
    const view = buildCartItemView({
      fallbackCurrency: "RUB",
      item: cartItem({
        lineTotal: 0,
        product: {
          id: "product-1",
          name: "Coffee",
          slug: "coffee",
          price: null,
        },
      }),
    });

    expect(view.displayLineTotal).toBeNull();
    expect(view.originalLineTotal).toBeNull();
  });

  it("does not recalculate unknown cart price from loaded product details", () => {
    const view = buildCartItemView({
      fallbackCurrency: "RUB",
      item: cartItem({
        lineTotal: 0,
        product: {
          id: "product-1",
          name: "Coffee",
          slug: "coffee",
          price: null,
        },
      }),
      product: product({
        price: "999",
      }),
    });

    expect(view.displayLineTotal).toBeNull();
    expect(view.originalLineTotal).toBeNull();
  });

  it("uses backend line total for priced variant lines even when product snapshots are price-less", () => {
    const view = buildCartItemView({
      fallbackCurrency: "RUB",
      item: cartItem({
        variantId: "variant-1",
        lineTotal: 890,
        unitPrice: 890,
        baseUnitPrice: 890,
        product: {
          id: "product-1",
          name: "Coffee",
          slug: "coffee",
          price: null,
        },
        variant: null,
      }),
      product: product({
        price: null,
        variants: [
          variant({
            price: null,
          }),
        ],
      }),
    });

    expect(view.displayLineTotal).toBe(890);
    expect(view.originalLineTotal).toBe(890);
  });

  it("uses backend cart line total instead of current product price", () => {
    const view = buildCartItemView({
      fallbackCurrency: "RUB",
      item: cartItem({
        lineTotal: 240,
        product: {
          id: "product-1",
          name: "Coffee",
          slug: "coffee",
          price: 120,
        },
      }),
      product: product({
        price: "999",
      }),
    });

    expect(view.displayLineTotal).toBe(240);
    expect(view.originalLineTotal).toBe(240);
  });

  it("uses price-list unit snapshot when legacy sale unit price is zero", () => {
    const view = buildCartItemView({
      fallbackCurrency: "RUB",
      item: cartItem({
        lineTotal: 0,
        product: {
          id: "product-1",
          name: "Coffee",
          slug: "coffee",
          price: null,
        },
        saleUnitId: "piece",
        saleUnit: {
          id: "piece",
          variantId: "variant-1",
          catalogSaleUnitId: null,
          code: "piece",
          name: "Piece",
          baseQuantity: 1,
          price: 0,
          barcode: null,
          isDefault: true,
          isActive: true,
          displayOrder: 0,
        },
        unitPrice: 0,
        unitPriceSnapshot: 100,
      }),
    });

    expect(view.displayLineTotal).toBe(200);
    expect(view.originalLineTotal).toBe(200);
  });

  it("resolves sale unit label from product variant sale units", () => {
    const view = buildCartItemView({
      fallbackCurrency: "RUB",
      item: cartItem({
        variantId: "variant-1",
        saleUnitId: "box",
        lineTotal: 240,
      }),
      product: product({
        variants: [
          variant({
            saleUnits: [
              {
                id: "piece",
                catalogSaleUnitId: null,
                code: "piece",
                name: "Piece",
                baseQuantity: "1",
                price: "10",
                barcode: null,
                isDefault: false,
                isActive: true,
                displayOrder: 0,
                createdAt: NOW,
                updatedAt: NOW,
                catalogSaleUnit: null,
              },
              {
                id: "box",
                catalogSaleUnitId: null,
                code: "box",
                name: "Box",
                baseQuantity: "12",
                price: "120",
                barcode: null,
                isDefault: true,
                isActive: true,
                displayOrder: 1,
                createdAt: NOW,
                updatedAt: NOW,
                catalogSaleUnit: null,
              },
            ],
          }),
        ],
      }),
    });

    expect(view.saleUnitId).toBe("box");
    expect(view.saleUnitLabel).toContain("Box");
    expect(view.saleUnitLabel).toContain("12");
    expect(view.saleUnitLabel).toContain("piece");
    expect(view.subtitle).toContain("Box");
  });

  it("uses the shared variant label format in cart subtitles", () => {
    const view = buildCartItemView({
      fallbackCurrency: "RUB",
      item: cartItem({
        variantId: "variant-1",
        variant: {
          ...variant({
            attributes: [
              {
                id: "variant-attribute-1",
                attributeId: "size",
                enumValueId: "size-36",
                attribute: {
                  id: "size",
                  key: "size",
                  displayName: "Size",
                  dataType: "ENUM",
                  isRequired: false,
                  isVariantAttribute: true,
                  isFilterable: false,
                  displayOrder: 1,
                  isHidden: false,
                },
                enumValue: {
                  id: "size-36",
                  value: "36",
                  displayName: "36",
                  displayOrder: 1,
                  businessId: null,
                },
              },
              {
                id: "variant-attribute-2",
                attributeId: "color",
                enumValueId: "color-blue",
                attribute: {
                  id: "color",
                  key: "color",
                  displayName: "Color",
                  dataType: "ENUM",
                  isRequired: false,
                  isVariantAttribute: true,
                  isFilterable: false,
                  displayOrder: 2,
                  isHidden: false,
                },
                enumValue: {
                  id: "color-blue",
                  value: "blue",
                  displayName: "Blue",
                  displayOrder: 1,
                  businessId: null,
                },
              },
            ],
          }),
          label: "",
          price: 100,
        },
      }),
    });

    expect(view.variantLabel).toBe("36 / Blue");
    expect(view.subtitle).toBe("36 / Blue");
  });

  it("hides technical default variant labels in cart subtitles", () => {
    const view = buildCartItemView({
      fallbackCurrency: "RUB",
      item: cartItem({
        variantId: "variant-default",
        variant: {
          id: "variant-default",
          sku: "SKU-DEFAULT",
          variantKey: "default",
          label: "default",
          price: 260,
          stock: 10,
          status: "ACTIVE",
          isAvailable: true,
          attributes: [],
        },
      }),
      product: product(),
    });

    expect(view.variantLabel).toBeNull();
    expect(view.subtitle).toBe("");
  });
});
