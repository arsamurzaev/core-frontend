import type { CategoryDto } from "@/shared/api/generated/react-query";
import { describe, expect, it } from "vitest";
import { buildCategoryDisplayList } from "./category-display";

const NOW = "2026-05-18T00:00:00.000Z";

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

describe("category display list", () => {
  it("hides empty storefront categories and prefixes child categories with parent name", () => {
    const result = buildCategoryDisplayList(
      [
        category({ id: "parent", name: "Обувь", productCount: 0 }),
        category({
          id: "child",
          parentId: "parent",
          name: "Кроссовки",
          productCount: 3,
        }),
      ],
      { hideEmpty: true },
    );

    expect(result.map((item) => [item.id, item.name])).toEqual([
      ["child", "Обувь / Кроссовки"],
    ]);
  });

  it("keeps empty categories when requested for admin-like lists", () => {
    const result = buildCategoryDisplayList([
      category({ id: "parent", name: "Одежда", productCount: 0 }),
      category({
        id: "child",
        parentId: "parent",
        name: "Худи",
        productCount: 0,
      }),
    ]);

    expect(result.map((item) => [item.id, item.name])).toEqual([
      ["parent", "Одежда"],
      ["child", "Одежда / Худи"],
    ]);
  });
});
