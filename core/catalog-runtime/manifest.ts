import type {
  CatalogCheckoutConfig,
  CatalogPresentationConfig,
  CatalogRuntimeAnalyticsEventId,
  CatalogRuntimeManifest,
  CatalogRuntimeManifestConfig,
} from "./metadata-contracts";
import type { CatalogRuntimeSlots } from "./slot-contracts";
import type { ResolvedProductCardPlugin } from "@/core/modules/product";

const DEFAULT_RUNTIME_MANIFEST: CatalogRuntimeManifestConfig = {
  id: "default",
  label: "Default storefront",
};

const DEFAULT_ANALYTICS_EVENTS: CatalogRuntimeAnalyticsEventId[] = [
  "catalog.view",
  "catalog.share",
  "catalog.filter",
  "product.view",
  "product.addToCart",
  "checkout.start",
  "checkout.submit",
];

interface ResolveCatalogRuntimeManifestInput {
  cart: {
    supportsManagerOrder: boolean;
  };
  checkout: CatalogCheckoutConfig;
  extension: {
    typeCode: string | string[];
    manifest?: CatalogRuntimeManifestConfig;
  } | null;
  presentation: CatalogPresentationConfig;
  productCard: ResolvedProductCardPlugin;
  slots: CatalogRuntimeSlots;
  typeCode: string;
}

function getExtensionTypeCodes(
  typeCode: string,
  extension: ResolveCatalogRuntimeManifestInput["extension"],
): string[] {
  if (!extension) {
    return typeCode ? [typeCode] : ["default"];
  }

  return Array.isArray(extension.typeCode)
    ? extension.typeCode
    : [extension.typeCode];
}

function getProductCardMode(
  productCard: ResolvedProductCardPlugin,
): CatalogRuntimeManifest["policies"]["productCardMode"] {
  return productCard.attributes.length > 0 ||
    productCard.badges.length > 0 ||
    !productCard.showVariants
    ? "configured"
    : "default";
}

function mergeAnalyticsEvents(
  events?: CatalogRuntimeAnalyticsEventId[],
): CatalogRuntimeAnalyticsEventId[] {
  return Array.from(new Set([...DEFAULT_ANALYTICS_EVENTS, ...(events ?? [])]));
}

export function resolveCatalogRuntimeManifest({
  cart,
  checkout,
  extension,
  presentation,
  productCard,
  slots,
  typeCode,
}: ResolveCatalogRuntimeManifestInput): CatalogRuntimeManifest {
  const config = extension?.manifest ?? DEFAULT_RUNTIME_MANIFEST;
  const slotManifest = {
    hasBrowser: Boolean(slots.Browser),
    hasCartCardAction: Boolean(slots.CartCardAction),
  };

  return {
    id: config.id,
    label: config.label,
    typeCodes: getExtensionTypeCodes(typeCode, extension),
    capabilities: {
      supportsBrands: presentation.supportsBrands,
      supportsCategoryDetails: presentation.supportsCategoryDetails,
      supportsPreorderCheckout: checkout.availableMethods.includes("PREORDER"),
      supportsManagerOrder: cart.supportsManagerOrder,
      hasBrowserSlot: slotManifest.hasBrowser,
      hasCartCardActionSlot: slotManifest.hasCartCardAction,
    },
    slots: slotManifest,
    policies: {
      browserMode: slotManifest.hasBrowser ? "runtime-slot" : "default",
      cartActionMode: slotManifest.hasCartCardAction
        ? "runtime-slot"
        : "default",
      categoryCardVariant: presentation.categoryCardVariant,
      checkoutMethods: checkout.availableMethods,
      defaultCheckoutMethods: checkout.defaultEnabledMethods,
      productCardMode: getProductCardMode(productCard),
    },
    analyticsEvents: mergeAnalyticsEvents(config.analyticsEvents),
  };
}
