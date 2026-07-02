export type * from "./metadata-contracts";
export type {
  CatalogStorefrontComposition,
  CatalogStorefrontCompositionSource,
} from "./storefront-composition";
export type { CatalogThemeScopeAttributes } from "./theme";
export {
  canOpenStorefrontProductPage,
  getCatalogStorefrontComposition,
  shouldLoadStorefrontHomePageData,
  shouldRenderStorefrontCartDrawer,
  shouldRenderStorefrontCatalogContent,
  shouldShowCatalogOrderSettings,
} from "./storefront-composition";
export {
  CATALOG_THEME_PRESETS,
  getCatalogThemeScopeAttributesForCatalog,
  resolveCatalogThemePresetByTypeCode,
  resolveCatalogThemePresetForCatalog,
} from "./theme";
