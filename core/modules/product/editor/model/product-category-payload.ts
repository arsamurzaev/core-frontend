export function normalizeProductCategoryIds(
  values: string[] | undefined,
): string[] {
  return (values ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}
