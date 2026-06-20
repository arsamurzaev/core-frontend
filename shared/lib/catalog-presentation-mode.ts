export type CatalogPresentationMode = "CATALOG" | "BUSINESS_CARD";

type CatalogPresentationModeSource =
  | {
      settings?: {
        presentationMode?: unknown;
      } | null;
    }
  | null
  | undefined;

export const DEFAULT_CATALOG_PRESENTATION_MODE: CatalogPresentationMode =
  "CATALOG";

export function isCatalogPresentationMode(
  value: unknown,
): value is CatalogPresentationMode {
  return value === "CATALOG" || value === "BUSINESS_CARD";
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
  return getCatalogPresentationMode(catalog) === "BUSINESS_CARD";
}
