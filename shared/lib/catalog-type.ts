type CatalogTypeLike = {
  type?: {
    code?: string | null;
  } | null;
} | null | undefined;

export function getCatalogTypeCode(catalog: CatalogTypeLike): string {
  return catalog?.type?.code?.trim().toLowerCase() ?? "";
}
