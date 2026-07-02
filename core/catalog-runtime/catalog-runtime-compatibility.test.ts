import { describe, expect, it } from "vitest";
import { canManageCatalogContent } from "@/shared/lib/catalog-content-access";
import { resolveCatalogRuntime } from "./resolve-catalog-runtime";
import {
  canOpenStorefrontProductPage,
  getCatalogStorefrontComposition,
  shouldShowCatalogOrderSettings,
} from "./storefront-composition";
import type {
  CatalogRuntimeManifestId,
  CatalogThemePresetId,
} from "./metadata-contracts";
import type { CatalogRuntime } from "./runtime-contracts";

type PresentationMode = "CATALOG" | "BUSINESS_CARD";

interface RuntimeCompatibilityCase {
  code: string;
  expected: {
    analyticsEvents?: string[];
    categoryCardVariant: "default" | "compact";
    checkoutMethods: string[];
    defaultCheckoutMethods: string[];
    hasBrowserSlot: boolean;
    hasCartCardActionSlot: boolean;
    hasExtension: boolean;
    label: string;
    manifestId: CatalogRuntimeManifestId;
    productCardMode: "default" | "configured";
    supportsBrands: boolean;
    supportsCategoryDetails: boolean;
    supportsManagerOrder: boolean;
    supportsPreorderCheckout: boolean;
    tabLabel: string;
    themeId: CatalogThemePresetId;
    typeCodes: string[];
  };
  label: string;
  presentationMode?: PresentationMode;
}

function catalog(code: string, presentationMode: PresentationMode = "CATALOG") {
  return {
    settings: {
      presentationMode,
    },
    type: {
      id: `type-${code}`,
      code,
      name: code,
      attributes: [],
    },
  };
}

function expectDerivedManifest(runtime: CatalogRuntime) {
  const hasBrowserSlot = Boolean(runtime.slots.Browser);
  const hasCartCardActionSlot = Boolean(runtime.slots.CartCardAction);

  expect(runtime.manifest.capabilities).toEqual({
    supportsBrands: runtime.presentation.supportsBrands,
    supportsCategoryDetails: runtime.presentation.supportsCategoryDetails,
    supportsPreorderCheckout:
      runtime.checkout.availableMethods.includes("PREORDER"),
    supportsManagerOrder: runtime.cart.supportsManagerOrder,
    hasBrowserSlot,
    hasCartCardActionSlot,
  });
  expect(runtime.manifest.slots).toEqual({
    hasBrowser: hasBrowserSlot,
    hasCartCardAction: hasCartCardActionSlot,
  });
  expect(runtime.manifest.policies).toEqual({
    browserMode: hasBrowserSlot ? "runtime-slot" : "default",
    cartActionMode: hasCartCardActionSlot ? "runtime-slot" : "default",
    categoryCardVariant: runtime.presentation.categoryCardVariant,
    checkoutMethods: runtime.checkout.availableMethods,
    defaultCheckoutMethods: runtime.checkout.defaultEnabledMethods,
    productCardMode:
      runtime.productCard.attributes.length > 0 ||
      runtime.productCard.badges.length > 0 ||
      !runtime.productCard.showVariants
        ? "configured"
        : "default",
  });
}

const RUNTIME_COMPATIBILITY_CASES: RuntimeCompatibilityCase[] = [
  {
    code: "flowers",
    label: "default catalog",
    expected: {
      categoryCardVariant: "default",
      checkoutMethods: ["DELIVERY", "PICKUP"],
      defaultCheckoutMethods: [],
      hasBrowserSlot: false,
      hasCartCardActionSlot: false,
      hasExtension: false,
      label: "Default storefront",
      manifestId: "default",
      productCardMode: "default",
      supportsBrands: true,
      supportsCategoryDetails: true,
      supportsManagerOrder: false,
      supportsPreorderCheckout: false,
      tabLabel: "Каталог",
      themeId: "default",
      typeCodes: ["flowers"],
    },
  },
  {
    code: "restaurant",
    label: "restaurant extension",
    expected: {
      analyticsEvents: ["checkout.preorderStart"],
      categoryCardVariant: "compact",
      checkoutMethods: ["DELIVERY", "PICKUP", "PREORDER"],
      defaultCheckoutMethods: ["DELIVERY", "PICKUP"],
      hasBrowserSlot: true,
      hasCartCardActionSlot: false,
      hasExtension: true,
      label: "Restaurant storefront",
      manifestId: "restaurant",
      productCardMode: "default",
      supportsBrands: false,
      supportsCategoryDetails: false,
      supportsManagerOrder: false,
      supportsPreorderCheckout: true,
      tabLabel: "Меню",
      themeId: "restaurant",
      typeCodes: ["restaurant", "cafe"],
    },
  },
  {
    code: "cafe",
    label: "restaurant alias with product-card plugin",
    expected: {
      analyticsEvents: ["checkout.preorderStart"],
      categoryCardVariant: "compact",
      checkoutMethods: ["DELIVERY", "PICKUP", "PREORDER"],
      defaultCheckoutMethods: ["DELIVERY", "PICKUP"],
      hasBrowserSlot: true,
      hasCartCardActionSlot: false,
      hasExtension: true,
      label: "Restaurant storefront",
      manifestId: "restaurant",
      productCardMode: "configured",
      supportsBrands: false,
      supportsCategoryDetails: false,
      supportsManagerOrder: false,
      supportsPreorderCheckout: true,
      tabLabel: "Меню",
      themeId: "restaurant",
      typeCodes: ["restaurant", "cafe"],
    },
  },
  {
    code: "wholesale",
    label: "wholesale extension",
    expected: {
      analyticsEvents: ["manager.orderStart"],
      categoryCardVariant: "default",
      checkoutMethods: ["DELIVERY", "PICKUP"],
      defaultCheckoutMethods: [],
      hasBrowserSlot: false,
      hasCartCardActionSlot: true,
      hasExtension: true,
      label: "Wholesale storefront",
      manifestId: "wholesale",
      productCardMode: "default",
      supportsBrands: true,
      supportsCategoryDetails: true,
      supportsManagerOrder: true,
      supportsPreorderCheckout: false,
      tabLabel: "Каталог",
      themeId: "wholesale",
      typeCodes: ["wholesale", "whosale"],
    },
  },
  {
    code: "whosale",
    label: "wholesale typo alias",
    expected: {
      analyticsEvents: ["manager.orderStart"],
      categoryCardVariant: "default",
      checkoutMethods: ["DELIVERY", "PICKUP"],
      defaultCheckoutMethods: [],
      hasBrowserSlot: false,
      hasCartCardActionSlot: true,
      hasExtension: true,
      label: "Wholesale storefront",
      manifestId: "wholesale",
      productCardMode: "default",
      supportsBrands: true,
      supportsCategoryDetails: true,
      supportsManagerOrder: true,
      supportsPreorderCheckout: false,
      tabLabel: "Каталог",
      themeId: "wholesale",
      typeCodes: ["wholesale", "whosale"],
    },
  },
  {
    code: "flowers",
    label: "business-card presentation mode",
    presentationMode: "BUSINESS_CARD",
    expected: {
      categoryCardVariant: "default",
      checkoutMethods: ["DELIVERY", "PICKUP"],
      defaultCheckoutMethods: [],
      hasBrowserSlot: false,
      hasCartCardActionSlot: false,
      hasExtension: false,
      label: "Default storefront",
      manifestId: "default",
      productCardMode: "default",
      supportsBrands: true,
      supportsCategoryDetails: true,
      supportsManagerOrder: false,
      supportsPreorderCheckout: false,
      tabLabel: "Каталог",
      themeId: "default",
      typeCodes: ["flowers"],
    },
  },
];

describe("catalog runtime compatibility matrix", () => {
  it.each(RUNTIME_COMPATIBILITY_CASES)(
    "keeps the $label contract stable",
    ({ code, expected, presentationMode }) => {
      const sourceCatalog = catalog(code, presentationMode);
      const runtime = resolveCatalogRuntime(sourceCatalog);

      expect(runtime.typeCode).toBe(code);
      expect(Boolean(runtime.extension)).toBe(expected.hasExtension);
      expect(runtime.theme.id).toBe(expected.themeId);
      expect(runtime.presentation.catalogTabLabel).toBe(expected.tabLabel);
      expect(runtime.presentation.supportsBrands).toBe(
        expected.supportsBrands,
      );
      expect(runtime.presentation.supportsCategoryDetails).toBe(
        expected.supportsCategoryDetails,
      );
      expect(runtime.presentation.categoryCardVariant).toBe(
        expected.categoryCardVariant,
      );
      expect(runtime.checkout.availableMethods).toEqual(
        expected.checkoutMethods,
      );
      expect(runtime.checkout.defaultEnabledMethods).toEqual(
        expected.defaultCheckoutMethods,
      );
      expect(runtime.cart.supportsManagerOrder).toBe(
        expected.supportsManagerOrder,
      );
      expect(Boolean(runtime.slots.Browser)).toBe(expected.hasBrowserSlot);
      expect(Boolean(runtime.slots.CartCardAction)).toBe(
        expected.hasCartCardActionSlot,
      );

      expect(runtime.manifest).toMatchObject({
        id: expected.manifestId,
        label: expected.label,
        typeCodes: expected.typeCodes,
      });
      expect(runtime.manifest.capabilities.supportsPreorderCheckout).toBe(
        expected.supportsPreorderCheckout,
      );
      expect(runtime.manifest.policies.productCardMode).toBe(
        expected.productCardMode,
      );
      for (const eventId of expected.analyticsEvents ?? []) {
        expect(runtime.manifest.analyticsEvents).toContain(eventId);
      }
      expect(new Set(runtime.manifest.analyticsEvents).size).toBe(
        runtime.manifest.analyticsEvents.length,
      );
      expectDerivedManifest(runtime);
    },
  );

  it("keeps business-card as presentation mode over the default runtime", () => {
    const sourceCatalog = catalog("flowers", "BUSINESS_CARD");
    const runtime = resolveCatalogRuntime(sourceCatalog);
    const composition = getCatalogStorefrontComposition(sourceCatalog);

    expect(composition).toEqual({
      presentationMode: "BUSINESS_CARD",
      isBusinessCard: true,
      shouldLoadHomePageData: false,
      shouldRenderCatalogContent: false,
      shouldRenderCartDrawer: false,
      canOpenProductPage: false,
      shouldShowCatalogOrderSettings: false,
    });
    expect(canOpenStorefrontProductPage(sourceCatalog)).toBe(false);
    expect(shouldShowCatalogOrderSettings(sourceCatalog)).toBe(false);
    expect(canManageCatalogContent(sourceCatalog)).toBe(false);
    expect(runtime.extension).toBeNull();
    expect(runtime.manifest.id).toBe("default");
    expect(runtime.theme.id).toBe("default");
  });

  it("keeps full catalog presentation open for storefront commerce", () => {
    const sourceCatalog = catalog("flowers", "CATALOG");
    const composition = getCatalogStorefrontComposition(sourceCatalog);

    expect(composition).toEqual({
      presentationMode: "CATALOG",
      isBusinessCard: false,
      shouldLoadHomePageData: true,
      shouldRenderCatalogContent: true,
      shouldRenderCartDrawer: true,
      canOpenProductPage: true,
      shouldShowCatalogOrderSettings: true,
    });
    expect(canOpenStorefrontProductPage(sourceCatalog)).toBe(true);
    expect(shouldShowCatalogOrderSettings(sourceCatalog)).toBe(true);
  });
});
