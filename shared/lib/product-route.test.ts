import { describe, expect, it } from "vitest";
import {
  buildHomeHrefWithCatalogQuery,
  buildProductHrefWithCatalogQuery,
} from "./product-route";

function searchParams(query: string) {
  return new URLSearchParams(query);
}

describe("product route helpers", () => {
  it("preserves catalog mode for product and home routes", () => {
    const params = searchParams("mode=BROWSE&searchTerm=coffee");

    expect(buildProductHrefWithCatalogQuery("flat white", params)).toBe(
      "/product/flat%20white?searchTerm=coffee&mode=BROWSE",
    );
    expect(buildHomeHrefWithCatalogQuery(params)).toBe(
      "/?searchTerm=coffee&mode=BROWSE",
    );
  });

  it("drops invalid catalog mode values", () => {
    const params = searchParams("mode=unknown&searchTerm=coffee");

    expect(buildProductHrefWithCatalogQuery("flat white", params)).toBe(
      "/product/flat%20white?searchTerm=coffee",
    );
  });
});
