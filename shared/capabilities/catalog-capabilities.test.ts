import { describe, expect, it } from "vitest";
import { shouldRequestCatalogCapabilities } from "./catalog-capabilities";

describe("shouldRequestCatalogCapabilities", () => {
  it("does not request current catalog features for guests", () => {
    expect(
      shouldRequestCatalogCapabilities({
        hasCatalog: true,
        isAuthenticated: false,
        userRole: "CATALOG",
      }),
    ).toBe(false);
  });

  it("requests current catalog features for catalog admins", () => {
    expect(
      shouldRequestCatalogCapabilities({
        hasCatalog: true,
        isAuthenticated: true,
        userRole: "CATALOG",
      }),
    ).toBe(true);
    expect(
      shouldRequestCatalogCapabilities({
        hasCatalog: true,
        isAuthenticated: true,
        userRole: "ADMIN",
      }),
    ).toBe(true);
  });

  it("does not request current catalog features for regular authenticated users", () => {
    expect(
      shouldRequestCatalogCapabilities({
        hasCatalog: true,
        isAuthenticated: true,
        userRole: "USER",
      }),
    ).toBe(false);
  });

  it("does not request current catalog features without a catalog", () => {
    expect(
      shouldRequestCatalogCapabilities({
        hasCatalog: false,
        isAuthenticated: true,
        userRole: "CATALOG",
      }),
    ).toBe(false);
  });
});
