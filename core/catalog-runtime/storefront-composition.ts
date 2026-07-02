import {
  CATALOG_PRESENTATION_MODE,
  getCatalogPresentationMode,
  type CatalogPresentationMode,
} from "./presentation-mode";

export type CatalogStorefrontCompositionSource =
  | {
      settings?: {
        presentationMode?: unknown;
      } | null;
    }
  | null
  | undefined;

export interface CatalogStorefrontComposition {
  presentationMode: CatalogPresentationMode;
  isBusinessCard: boolean;
  shouldLoadHomePageData: boolean;
  shouldRenderCatalogContent: boolean;
  shouldRenderCartDrawer: boolean;
  canOpenProductPage: boolean;
  shouldShowCatalogOrderSettings: boolean;
}

export function getCatalogStorefrontComposition(
  catalog?: CatalogStorefrontCompositionSource,
): CatalogStorefrontComposition {
  const presentationMode = getCatalogPresentationMode(catalog);
  const isBusinessCard =
    presentationMode === CATALOG_PRESENTATION_MODE.BUSINESS_CARD;
  const canUseCatalogCommerce = !isBusinessCard;

  return {
    presentationMode,
    isBusinessCard,
    shouldLoadHomePageData: canUseCatalogCommerce,
    shouldRenderCatalogContent: canUseCatalogCommerce,
    shouldRenderCartDrawer: canUseCatalogCommerce,
    canOpenProductPage: canUseCatalogCommerce,
    shouldShowCatalogOrderSettings: canUseCatalogCommerce,
  };
}

export function shouldLoadStorefrontHomePageData(
  catalog?: CatalogStorefrontCompositionSource,
): boolean {
  return getCatalogStorefrontComposition(catalog).shouldLoadHomePageData;
}

export function shouldRenderStorefrontCatalogContent(
  catalog?: CatalogStorefrontCompositionSource,
): boolean {
  return getCatalogStorefrontComposition(catalog).shouldRenderCatalogContent;
}

export function shouldRenderStorefrontCartDrawer(
  catalog?: CatalogStorefrontCompositionSource,
): boolean {
  return getCatalogStorefrontComposition(catalog).shouldRenderCartDrawer;
}

export function canOpenStorefrontProductPage(
  catalog?: CatalogStorefrontCompositionSource,
): boolean {
  return getCatalogStorefrontComposition(catalog).canOpenProductPage;
}

export function shouldShowCatalogOrderSettings(
  catalog?: CatalogStorefrontCompositionSource,
): boolean {
  return getCatalogStorefrontComposition(catalog).shouldShowCatalogOrderSettings;
}
