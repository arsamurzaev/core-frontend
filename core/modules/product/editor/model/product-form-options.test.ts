import {
  ProductTypeAttributeAttributeDtoDataType,
  ProductTypeDtoScope,
  type BrandDto,
  type CategoryDto,
  type ProductTypeAttributeDto,
  type ProductTypeDto,
} from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import {
  buildBrandOptions,
  buildCategoryOptions,
  buildProductTypeOptions,
} from "./product-form-options";

const NOW = "2026-05-13T00:00:00.000Z";

function brand(overrides: Partial<BrandDto>): BrandDto {
  return {
    id: "brand-1",
    catalogId: "catalog-1",
    name: "Brand",
    slug: "brand",
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function category(overrides: Partial<CategoryDto>): CategoryDto {
  return {
    id: "category-1",
    catalogId: "catalog-1",
    parentId: null,
    position: 0,
    productCount: 0,
    name: "Category",
    imageMedia: null,
    descriptor: null,
    discount: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function productType(overrides: Partial<ProductTypeDto>): ProductTypeDto {
  return {
    id: "type-1",
    catalogId: "catalog-1",
    scope: ProductTypeDtoScope.CATALOG,
    code: "type",
    name: "Type",
    description: null,
    isActive: true,
    isArchived: false,
    archivedAt: null,
    attributes: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function productTypeAttribute(
  overrides: Partial<ProductTypeAttributeDto> = {},
): ProductTypeAttributeDto {
  return {
    productTypeId: "type-1",
    attributeId: "attribute-1",
    isVariant: false,
    isRequired: false,
    displayOrder: 0,
    attribute: {
      id: "attribute-1",
      key: "attribute",
      displayName: "Attribute",
      dataType: ProductTypeAttributeAttributeDtoDataType.ENUM,
    },
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("product form options", () => {
  it("builds sorted brand options only when brands are supported", () => {
    const brands = [
      brand({ id: "b", name: "Banana" }),
      brand({ id: "a", name: "Apple" }),
    ];

    expect(buildBrandOptions(brands, false)).toEqual([]);
    expect(buildBrandOptions(brands, true)).toEqual([
      { label: "Apple", value: "a" },
      { label: "Banana", value: "b" },
    ]);
  });

  it("builds sorted category options", () => {
    expect(
      buildCategoryOptions([
        category({ id: "b", name: "Beta" }),
        category({ id: "a", name: "Alpha" }),
      ]),
    ).toEqual([
      { label: "Alpha", value: "a" },
      { label: "Beta", value: "b" },
    ]);
  });

  it("uses parent paths for nested category options", () => {
    expect(
      buildCategoryOptions([
        category({ id: "parent", name: "Shoes" }),
        category({ id: "child", parentId: "parent", name: "Sneakers" }),
      ]),
    ).toContainEqual({ label: "Shoes / Sneakers", value: "child" });
  });

  it("builds active non-archived product type options", () => {
    expect(
      buildProductTypeOptions([
        productType({ id: "archived", isArchived: true, name: "Archived" }),
        productType({ id: "inactive", isActive: false, name: "Inactive" }),
        productType({
          id: "service",
          description: "Service products",
          name: "Service",
        }),
      ]),
    ).toEqual([
      {
        description: "Service products",
        label: "Service",
        value: "service",
      },
    ]);
  });

  it("hides variant product types when variants feature is disabled", () => {
    expect(
      buildProductTypeOptions(
        [
          productType({
            id: "simple",
            name: "Simple",
            attributes: [productTypeAttribute({ isVariant: false })],
          }),
          productType({
            id: "matrix",
            name: "Matrix",
            attributes: [productTypeAttribute({ isVariant: true })],
          }),
        ],
        { canUseProductVariants: false },
      ),
    ).toEqual([
      {
        description: undefined,
        label: "Simple",
        value: "simple",
      },
    ]);
  });

  it("keeps variant product types when variants feature is enabled", () => {
    expect(
      buildProductTypeOptions(
        [
          productType({
            id: "matrix",
            name: "Matrix",
            attributes: [productTypeAttribute({ isVariant: true })],
          }),
        ],
        { canUseProductVariants: true },
      ),
    ).toEqual([
      {
        description: undefined,
        label: "Matrix",
        value: "matrix",
      },
    ]);
  });

  it("preserves selected variant product type while variants feature is disabled", () => {
    expect(
      buildProductTypeOptions(
        [
          productType({
            id: "matrix",
            name: "Matrix",
            attributes: [productTypeAttribute({ isVariant: true })],
          }),
        ],
        {
          canUseProductVariants: false,
          preserveProductTypeIds: ["matrix"],
        },
      ),
    ).toEqual([
      {
        description: undefined,
        label: "Matrix",
        value: "matrix",
      },
    ]);
  });
});
