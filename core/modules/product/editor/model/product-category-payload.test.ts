import { describe, expect, it } from "vitest";
import { normalizeProductCategoryIds } from "./product-category-payload";

describe("product category payload", () => {
  it("normalizes selected category ids", () => {
    expect(normalizeProductCategoryIds([" a ", "", "b", "   "])).toEqual([
      "a",
      "b",
    ]);
    expect(normalizeProductCategoryIds(undefined)).toEqual([]);
  });
});
