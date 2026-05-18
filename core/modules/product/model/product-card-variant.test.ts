import {
  ProductVariantPickerOptionDtoStatus,
  type ProductWithAttributesDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { resolveProductCardVariantState } from "./product-card-variant";

function product(
  overrides: Partial<ProductWithAttributesDto> = {},
): ProductWithAttributesDto {
  return {
    id: "product-1",
    sku: "SKU-1",
    name: "Product",
    slug: "product",
    price: "1000",
    priceState: "KNOWN",
    displayPrice: "1000",
    minPrice: "1000",
    maxPrice: "1000",
    availabilityState: "AVAILABLE",
    stock: 10,
    defaultVariantId: null,
    requiresVariantSelection: false,
    media: [],
    brand: null,
    productType: null,
    categories: [],
    integration: null,
    isPopular: false,
    status: "ACTIVE",
    position: 0,
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
    productAttributes: [],
    variantSummary: {
      activeCount: 0,
      maxPrice: null,
      minPrice: null,
      singleVariantId: null,
      totalStock: 0,
    },
    variantPickerOptions: [],
    ...overrides,
  };
}

describe("resolveProductCardVariantState", () => {
  it("uses simple product stock when no variant selection is needed", () => {
    expect(
      resolveProductCardVariantState(
        product({
          availabilityState: "OUT_OF_STOCK",
          stock: 0,
        }),
        { canUseVariants: true },
      ),
    ).toEqual(
      expect.objectContaining({
        isUnavailable: true,
        maxQuantity: 0,
        requiresVariantSelection: false,
      }),
    );

    expect(
      resolveProductCardVariantState(
        product({
          availabilityState: "AVAILABLE",
          stock: null,
        }),
        { canUseVariants: true },
      ),
    ).toEqual(
      expect.objectContaining({
        isUnavailable: false,
        maxQuantity: undefined,
      }),
    );
  });

  it("does not block simple zero stock when stock is not enforced", () => {
    expect(
      resolveProductCardVariantState(
        product({
          availabilityState: "OUT_OF_STOCK",
          stock: 0,
        }),
        {
          canUseVariants: true,
          shouldEnforceStock: false,
        },
      ),
    ).toEqual(
      expect.objectContaining({
        isUnavailable: false,
        maxQuantity: undefined,
      }),
    );
  });

  it("always blocks an explicitly unavailable product", () => {
    expect(
      resolveProductCardVariantState(
        product({
          availabilityState: "UNAVAILABLE",
          stock: null,
        }),
        {
          canUseVariants: true,
          shouldEnforceStock: false,
        },
      ).isUnavailable,
    ).toBe(true);
  });

  it("trusts explicit backend selection requirement even without product type", () => {
    expect(
      resolveProductCardVariantState(
        product({
          requiresVariantSelection: true,
          variantSummary: {
            activeCount: 2,
            maxPrice: "1200",
            minPrice: "1000",
            singleVariantId: null,
            totalStock: 5,
          },
        }),
        { canUseVariants: true },
      ),
    ).toEqual(
      expect.objectContaining({
        requiresVariantSelection: true,
        shouldOpenPicker: true,
      }),
    );
  });

  it("can infer a single variant from picker options", () => {
    expect(
      resolveProductCardVariantState(
        product({
          variantPickerOptions: [
            {
              id: "variant-1",
              isAvailable: true,
              label: "42",
              maxQuantity: 3,
              price: "1000",
              saleUnitId: null,
              saleUnitPrice: null,
              status: ProductVariantPickerOptionDtoStatus.ACTIVE,
              stock: 3,
            },
          ],
        }),
        { canUseVariants: true },
      ),
    ).toEqual(
      expect.objectContaining({
        requiresVariantSelection: false,
        singleVariantId: "variant-1",
      }),
    );
  });

  it("does not limit a single variant when stock is null", () => {
    expect(
      resolveProductCardVariantState(
        product({
          variantSummary: {
            activeCount: 1,
            maxPrice: "1000",
            minPrice: "1000",
            singleVariantId: "variant-1",
            totalStock: null,
          },
          variantPickerOptions: [
            {
              id: "variant-1",
              isAvailable: true,
              label: "42",
              maxQuantity: null,
              price: "1000",
              saleUnitId: null,
              saleUnitPrice: null,
              status: ProductVariantPickerOptionDtoStatus.ACTIVE,
              stock: null,
            },
          ],
        }),
        { canUseVariants: true },
      ),
    ).toEqual(
      expect.objectContaining({
        isUnavailable: false,
        maxQuantity: undefined,
        singleVariantId: "variant-1",
      }),
    );
  });
});
