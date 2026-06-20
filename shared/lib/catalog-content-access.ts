import { isBusinessCardCatalog } from "@/shared/lib/catalog-presentation-mode";

type CatalogContentAccessRef = {
  parentId?: string | null;
  settings?: {
    presentationMode?: unknown;
  } | null;
};

export function isChildCatalog(
  catalog?: CatalogContentAccessRef | null,
): boolean {
  return Boolean(catalog?.parentId);
}

export function canManageCatalogContent(
  catalog?: CatalogContentAccessRef | null,
): boolean {
  return !isChildCatalog(catalog) && !isBusinessCardCatalog(catalog);
}
