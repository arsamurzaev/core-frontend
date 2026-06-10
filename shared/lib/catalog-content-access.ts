type CatalogContentAccessRef = {
  parentId?: string | null;
};

export function isChildCatalog(
  catalog?: CatalogContentAccessRef | null,
): boolean {
  return Boolean(catalog?.parentId);
}

export function canManageCatalogContent(
  catalog?: CatalogContentAccessRef | null,
): boolean {
  return !isChildCatalog(catalog);
}
