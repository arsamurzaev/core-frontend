import { describe, expect, it } from "vitest";
import type { CatalogCurrentDto } from "@/shared/api/generated/react-query";
import {
  catalogRuntimeSupportsBrands,
  getCatalogRuntimeCheckoutConfigForCatalog,
  getCatalogRuntimeCommentPlaceholder,
  getCatalogRuntimePresentation,
  isCatalogRuntimeType,
  isRestaurantCatalog,
  resolveCatalogRuntimeCheckoutAvailableMethods,
  resolveCatalogRuntimeProductCard,
} from "./catalog-runtime-utils";
import { resolveCatalogRuntime } from "./resolve-catalog-runtime";

function catalogType(code: string): CatalogCurrentDto["type"] {
  return {
    id: `type-${code}`,
    code,
    name: code,
    attributes: [],
  };
}

function catalogWithType(
  code: string,
): Pick<CatalogCurrentDto, "type" | "settings" | "contacts"> {
  return {
    contacts: [],
    settings: null,
    type: catalogType(code),
  };
}

describe("catalog runtime utils", () => {
  it("exposes presentation and type helpers without sandbox logic", () => {
    const cafe = catalogWithType("cafe");

    expect(isRestaurantCatalog(cafe)).toBe(true);
    expect(isCatalogRuntimeType(cafe, ["restaurant", "cafe"])).toBe(true);
    expect(catalogRuntimeSupportsBrands(cafe)).toBe(false);
    expect(getCatalogRuntimePresentation(cafe).catalogTabLabel).toBe(
      resolveCatalogRuntime(cafe).presentation.catalogTabLabel,
    );
  });

  it("exposes checkout helpers from runtime contract", () => {
    const cafe = catalogWithType("cafe");

    expect(resolveCatalogRuntimeCheckoutAvailableMethods(cafe)).toEqual([
      "DELIVERY",
      "PICKUP",
      "PREORDER",
    ]);
    expect(getCatalogRuntimeCheckoutConfigForCatalog(cafe).availableMethods).toEqual([
      "DELIVERY",
      "PICKUP",
      "PREORDER",
    ]);
    expect(getCatalogRuntimeCommentPlaceholder(cafe)).toBe(
      resolveCatalogRuntime(cafe).checkout.commentPlaceholder,
    );
  });

  it("exposes product-card config by type code", () => {
    expect(resolveCatalogRuntimeProductCard("cafe")).toMatchObject({
      badges: ["Cafe"],
      showVariants: true,
    });
  });
});
