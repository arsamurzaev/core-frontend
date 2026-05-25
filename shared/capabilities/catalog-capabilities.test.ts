import { describe, expect, it } from "vitest";
import {
  canShowBetaField,
  canShowIiko,
  canShowMoySklad,
  canShowProductTypes,
  canShowSaleUnits,
  canShowVariants,
  canUseInternalInventory,
  DEFAULT_CATALOG_CAPABILITIES,
  resolveCatalogProductStructureVisibility,
  shouldRequestCatalogCapabilities,
  shouldHideProductStructureControlsForCatalogManager,
} from "./catalog-capabilities";

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

describe("capability display helpers", () => {
  const capabilities = {
    ...DEFAULT_CATALOG_CAPABILITIES,
    canUseCatalogSaleUnits: true,
    canUseInternalInventory: false,
    canUseIikoIntegration: true,
    canUseMoySkladIntegration: true,
    canUseProductTypes: true,
    canUseProductVariants: false,
  };

  it("exposes named UI gates", () => {
    expect(canShowProductTypes(capabilities)).toBe(true);
    expect(canShowVariants(capabilities)).toBe(false);
    expect(canShowSaleUnits(capabilities)).toBe(true);
    expect(canUseInternalInventory(capabilities)).toBe(false);
    expect(canShowMoySklad(capabilities)).toBe(true);
    expect(canShowIiko(capabilities)).toBe(true);
  });

  it("maps beta field names to effective gates", () => {
    expect(canShowBetaField(capabilities, "productTypes")).toBe(true);
    expect(canShowBetaField(capabilities, "productVariants")).toBe(false);
    expect(canShowBetaField(capabilities, "saleUnits")).toBe(true);
    expect(canShowBetaField(capabilities, "internalInventory")).toBe(false);
    expect(canShowBetaField(capabilities, "moyskladIntegration")).toBe(true);
    expect(canShowBetaField(capabilities, "iikoIntegration")).toBe(true);
  });

  it("hides product structure controls only for catalog managers with MoySklad", () => {
    expect(
      shouldHideProductStructureControlsForCatalogManager({
        capabilities: {
          ...capabilities,
          canUseIikoIntegration: false,
        },
        moySkladConfigured: true,
        userRole: "CATALOG",
      }),
    ).toBe(true);
    expect(
      shouldHideProductStructureControlsForCatalogManager({
        capabilities: {
          ...capabilities,
          canUseIikoIntegration: false,
        },
        moySkladConfigured: true,
        userRole: "ADMIN",
      }),
    ).toBe(false);
    expect(
      shouldHideProductStructureControlsForCatalogManager({
        capabilities: {
          ...capabilities,
          canUseIikoIntegration: false,
        },
        moySkladConfigured: false,
        userRole: "CATALOG",
      }),
    ).toBe(false);
  });

  it("hides product structure controls for catalog managers with configured iiko", () => {
    expect(
      shouldHideProductStructureControlsForCatalogManager({
        capabilities: {
          ...capabilities,
          canUseMoySkladIntegration: false,
        },
        iikoConfigured: true,
        userRole: "CATALOG",
      }),
    ).toBe(true);
  });

  it("disables product type and variant gates when product structure is hidden", () => {
    expect(resolveCatalogProductStructureVisibility(capabilities, true)).toEqual({
      canUseProductTypes: false,
      canUseProductVariants: false,
      hideProductStructureControls: true,
    });
  });
});
