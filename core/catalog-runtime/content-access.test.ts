import { describe, expect, it } from "vitest";
import { canManageCatalogContent } from "./content-access";

describe("catalog runtime content access", () => {
  it("allows full root catalogs to manage content", () => {
    expect(
      canManageCatalogContent({
        parentId: null,
        settings: { presentationMode: "CATALOG" },
      }),
    ).toBe(true);
  });

  it("blocks content management for business card catalogs", () => {
    expect(
      canManageCatalogContent({
        parentId: null,
        settings: { presentationMode: "BUSINESS_CARD" },
      }),
    ).toBe(false);
  });

  it("blocks content management for child catalogs", () => {
    expect(
      canManageCatalogContent({
        parentId: "parent-1",
        settings: { presentationMode: "CATALOG" },
      }),
    ).toBe(false);
  });
});
