export type CatalogPresentationMode = "CATALOG" | "BUSINESS_CARD";

export const CATALOG_PRESENTATION_MODE = {
  CATALOG: "CATALOG",
  BUSINESS_CARD: "BUSINESS_CARD",
} as const satisfies Record<CatalogPresentationMode, CatalogPresentationMode>;

type CatalogPresentationModeSource =
  | {
      settings?: {
        presentationMode?: unknown;
      } | null;
    }
  | null
  | undefined;

export const DEFAULT_CATALOG_PRESENTATION_MODE: CatalogPresentationMode =
  CATALOG_PRESENTATION_MODE.CATALOG;

export function isCatalogPresentationMode(
  value: unknown,
): value is CatalogPresentationMode {
  return (
    value === CATALOG_PRESENTATION_MODE.CATALOG ||
    value === CATALOG_PRESENTATION_MODE.BUSINESS_CARD
  );
}

export function getCatalogPresentationMode(
  catalog?: CatalogPresentationModeSource,
): CatalogPresentationMode {
  const value = catalog?.settings?.presentationMode;
  return isCatalogPresentationMode(value)
    ? value
    : DEFAULT_CATALOG_PRESENTATION_MODE;
}

export function isBusinessCardCatalog(
  catalog?: CatalogPresentationModeSource,
): boolean {
  return (
    getCatalogPresentationMode(catalog) ===
    CATALOG_PRESENTATION_MODE.BUSINESS_CARD
  );
}
