import type {
  CatalogCheckoutConfig,
  CatalogPresentationConfig,
  CatalogRuntimeManifest,
  CatalogRuntimeManifestConfig,
  CatalogThemeConfig,
  CatalogThemePreset,
} from "./metadata-contracts";
import type { CatalogRuntimeSlots } from "./slot-contracts";
import type {
  ProductCardPluginConfig,
  ResolvedProductCardPlugin,
} from "@/core/modules/product";
import type { CatalogPriceFormatMode } from "@/shared/lib/price-format";

export interface CatalogPricingConfig {
  priceFormatMode: CatalogPriceFormatMode;
}

export interface CatalogExperienceRuntimeConfig {
  supportsHallMode: boolean;
}

export interface CatalogExtension {
  typeCode: string | string[];
  manifest?: CatalogRuntimeManifestConfig;
  presentation?: Partial<CatalogPresentationConfig>;
  checkout?: Partial<CatalogCheckoutConfig>;
  theme?: CatalogThemeConfig;
  productCard?: ProductCardPluginConfig;
  cart?: {
    supportsManagerOrder?: boolean;
  };
  pricing?: Partial<CatalogPricingConfig>;
  experience?: Partial<CatalogExperienceRuntimeConfig>;
  slots?: CatalogRuntimeSlots;
}

export type CatalogPlugin = CatalogExtension;

export interface CatalogRuntime {
  extension: CatalogExtension | null;
  typeCode: string;
  manifest: CatalogRuntimeManifest;
  presentation: CatalogPresentationConfig;
  checkout: CatalogCheckoutConfig;
  theme: CatalogThemePreset;
  productCard: ResolvedProductCardPlugin;
  cart: {
    supportsManagerOrder: boolean;
  };
  pricing: CatalogPricingConfig;
  experience: CatalogExperienceRuntimeConfig;
  slots: CatalogRuntimeSlots;
}
