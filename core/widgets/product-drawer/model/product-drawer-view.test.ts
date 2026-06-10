import {
  ProductAttributeRefDtoDataType,
  ProductVariantDtoStatus,
  ProductVariantPickerOptionDtoStatus,
  ProductVariantSummaryDto,
  ProductWithDetailsDtoStatus,
  type ProductAttributeDto,
  type ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { buildProductDrawerViewModel } from "./product-drawer-view";

const NOW = "2026-05-14T00:00:00.000Z";

function variantSummary(
  overrides: Partial<ProductVariantSummaryDto> = {},
): ProductVariantSummaryDto {
  return {
    minPrice: null,
    maxPrice: null,
    activeCount: 0,
    totalStock: 0,
    singleVariantId: null,
    ...overrides,
  };
}

function productAttribute(
  overrides: Partial<ProductAttributeDto> & {
    key: string;
    displayName: string;
  },
): ProductAttributeDto {
  const { key, displayName, valueString = "value", ...rest } = overrides;

  return {
    id: `${key}-value`,
    attributeId: `${key}-attribute`,
    enumValueId: null,
    valueString,
    valueInteger: null,
    valueDecimal: null,
    valueBoolean: null,
    valueDateTime: null,
    enumValue: null,
    attribute: {
      id: `${key}-attribute`,
      key,
      displayName,
      dataType: ProductAttributeRefDtoDataType.STRING,
      isRequired: false,
      isVariantAttribute: false,
      isFilterable: false,
      displayOrder: 10,
      isHidden: false,
      ...rest.attribute,
    },
    ...rest,
  };
}

function product(
  overrides: Partial<ProductWithDetailsDto> & {
    usesPriceList?: boolean | null;
  } = {},
): ProductWithDetailsDto {
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
    saleUnits: [],
    requiresVariantSelection: false,
    media: [],
    brand: null,
    productType: null,
    categories: [],
    integration: null,
    isPopular: false,
    status: ProductWithDetailsDtoStatus.ACTIVE,
    position: 0,
    createdAt: NOW,
    updatedAt: NOW,
    productAttributes: [],
    variantSummary: variantSummary(),
    variantPickerOptions: [],
    variants: [],
    seo: null,
    ...overrides,
  } as ProductWithDetailsDto;
}

describe("buildProductDrawerViewModel", () => {
  it("shows visible product attributes without duplicating drawer system fields", () => {
    const view = buildProductDrawerViewModel({
      catalog: null,
      isError: false,
      isLoading: false,
      product: product({
        productAttributes: [
          productAttribute({
            key: "subtitle",
            displayName: "Subtitle",
            valueString: "Short text",
          }),
          productAttribute({
            key: "description",
            displayName: "Description",
            valueString: "Long text",
          }),
          productAttribute({
            key: "material",
            displayName: "Материал",
            valueString: "Хлопок",
          }),
          productAttribute({
            key: "hidden",
            displayName: "Hidden",
            valueString: "secret",
            attribute: {
              id: "hidden-attribute",
              key: "hidden",
              displayName: "Hidden",
              dataType: ProductAttributeRefDtoDataType.STRING,
              isRequired: false,
              isVariantAttribute: false,
              isFilterable: false,
              displayOrder: 20,
              isHidden: true,
            },
          }),
        ],
      }),
    });

    expect(view.subtitle).toBe("Short text");
    expect(view.description).toBe("Long text");
    expect(view.attributeRows).toEqual([
      {
        id: "material-attribute",
        label: "Материал",
        value: "Хлопок",
      },
    ]);
  });

  it("keeps preview attributes when the detailed product has none", () => {
    const view = buildProductDrawerViewModel({
      catalog: null,
      isError: false,
      isLoading: false,
      previewProduct: product({
        productAttributes: [
          productAttribute({
            key: "subtitle",
            displayName: "Subtitle",
            valueString: "Preview subtitle",
          }),
          productAttribute({
            key: "description",
            displayName: "Description",
            valueString: "Preview description",
          }),
          productAttribute({
            key: "color",
            displayName: "Color",
            valueString: "Black",
          }),
        ],
      }),
      product: product({
        name: "Loaded product",
        productAttributes: [],
      }),
    });

    expect(view.displayName).toBe("Loaded product");
    expect(view.subtitle).toBe("Preview subtitle");
    expect(view.description).toBe("Preview description");
    expect(view.attributeRows).toEqual([
      {
        id: "color-attribute",
        label: "Color",
        value: "Black",
      },
    ]);
  });

  it("keeps preview variant labels when the detailed product has no variant rows yet", () => {
    const productType = {
      id: "product-type-1",
      code: "shoes",
      name: "Shoes",
    };

    const view = buildProductDrawerViewModel({
      catalog: null,
      isError: false,
      isLoading: false,
      previewProduct: product({
        productType,
        variantPickerOptions: [
          {
            id: "variant-36",
            label: "36",
            price: null,
            stock: 1,
            status: ProductVariantPickerOptionDtoStatus.ACTIVE,
            isAvailable: true,
            saleUnitId: null,
            saleUnitPrice: null,
            maxQuantity: 1,
          },
          {
            id: "variant-37",
            label: "37",
            price: null,
            stock: 1,
            status: ProductVariantPickerOptionDtoStatus.ACTIVE,
            isAvailable: true,
            saleUnitId: null,
            saleUnitPrice: null,
            maxQuantity: 1,
          },
        ],
      }),
      product: product({
        productType,
        variantPickerOptions: [],
        variants: [
          {
            id: "variant-disabled",
            sku: "SKU-DISABLED",
            variantKey: "size=disabled",
            kind: "MATRIX",
            stock: 0,
            price: null,
            status: ProductVariantDtoStatus.DISABLED,
            isAvailable: false,
            createdAt: NOW,
            updatedAt: NOW,
            attributes: [],
            saleUnits: [],
          },
        ],
      }),
    });

    expect(view.variantsSummary).toBe("36, 37");
  });

  it("hides price-list variant labels without an active price", () => {
    const productType = {
      id: "product-type-1",
      code: "shoes",
      name: "Shoes",
    };

    const view = buildProductDrawerViewModel({
      catalog: null,
      isError: false,
      isLoading: false,
      previewProduct: product({
        productType,
        usesPriceList: true,
        variantPickerOptions: [
          {
            id: "variant-xs",
            label: "XS",
            price: "350.00",
            stock: 1,
            status: ProductVariantPickerOptionDtoStatus.ACTIVE,
            isAvailable: true,
            saleUnitId: null,
            saleUnitPrice: null,
            maxQuantity: 1,
          },
          {
            id: "variant-s",
            label: "S",
            price: null,
            stock: 1,
            status: ProductVariantPickerOptionDtoStatus.ACTIVE,
            isAvailable: true,
            saleUnitId: null,
            saleUnitPrice: null,
            maxQuantity: 1,
          },
        ],
      }),
      product: product({
        productType,
        usesPriceList: true,
        variantPickerOptions: [],
        variants: [],
      }),
    });

    expect(view.variantsSummary).toBe("XS");
  });

  it("shows only selectable variant labels in the drawer summary", () => {
    const productType = {
      id: "product-type-1",
      code: "apparel",
      name: "Apparel",
    };
    const variantAttribute = {
      id: "size",
      key: "size",
      displayName: "Размер",
      dataType: ProductAttributeRefDtoDataType.ENUM,
      isRequired: false,
      isVariantAttribute: true,
      isFilterable: false,
      displayOrder: 1,
      isHidden: false,
    };
    const makeVariant = (
      id: string,
      value: string,
      status: ProductVariantDtoStatus,
    ) => ({
      id: `variant-${id}`,
      sku: `SKU-${id}`,
      variantKey: `size=${id}`,
      kind: "MATRIX" as const,
      stock: status === ProductVariantDtoStatus.ACTIVE ? 3 : 0,
      price: status === ProductVariantDtoStatus.ACTIVE ? "350" : null,
      status,
      isAvailable: status === ProductVariantDtoStatus.ACTIVE,
      createdAt: NOW,
      updatedAt: NOW,
      attributes: [
        {
          id: `variant-attribute-${id}`,
          attributeId: "size",
          enumValueId: id,
          attribute: variantAttribute,
          enumValue: {
            id,
            value: id,
            displayName: value,
            displayOrder: 1,
            businessId: null,
          },
        },
      ],
      saleUnits: [],
    });

    const view = buildProductDrawerViewModel({
      catalog: null,
      isError: false,
      isLoading: false,
      product: product({
        productType,
        variants: [
          makeVariant("xs", "XS", ProductVariantDtoStatus.ACTIVE),
          makeVariant("s", "S", ProductVariantDtoStatus.OUT_OF_STOCK),
        ],
      }),
    });

    expect(view.variantsSummary).toBe("XS");
  });

  it("uses variant summary price instead of legacy product price", () => {
    const view = buildProductDrawerViewModel({
      catalog: null,
      isError: false,
      isLoading: false,
      product: product({
        price: "12000",
        priceState: "RANGE",
        displayPrice: "5500",
        minPrice: "5500",
        maxPrice: "5500",
        requiresVariantSelection: true,
        productType: {
          id: "product-type-1",
          code: "shoes",
          name: "Shoes",
        },
        variantSummary: variantSummary({
          minPrice: "5500",
          maxPrice: "5500",
          activeCount: 2,
          totalStock: 2,
        }),
      }),
    });

    expect(view.price).toBe(5500);
    expect(view.displayPrice).toBe(5500);
  });

  it("keeps unknown price empty and zero price visible", () => {
    const unknownPriceView = buildProductDrawerViewModel({
      catalog: null,
      isError: false,
      isLoading: false,
      product: product({
        price: null,
        priceState: "UNKNOWN",
        displayPrice: null,
        minPrice: null,
        maxPrice: null,
      }),
    });
    const zeroPriceView = buildProductDrawerViewModel({
      catalog: null,
      isError: false,
      isLoading: false,
      product: product({
        price: "0",
        priceState: "KNOWN",
        displayPrice: "0",
        minPrice: "0",
        maxPrice: "0",
      }),
    });

    expect(unknownPriceView.price).toBeNull();
    expect(unknownPriceView.displayPrice).toBeNull();
    expect(zeroPriceView.price).toBe(0);
    expect(zeroPriceView.displayPrice).toBe(0);
  });
});
