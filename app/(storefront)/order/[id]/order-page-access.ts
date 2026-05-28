import { isCatalogManagerRole } from "@/shared/lib/catalog-role";

type OrderPageCatalog = {
  features?: {
    canUseIikoIntegration?: boolean | null;
    effective?: Record<string, boolean> | null;
  } | null;
} | null;

export function catalogCanUseIikoOrderTimeline(
  catalog: OrderPageCatalog | undefined,
): boolean {
  const features = catalog?.features;

  return Boolean(
    features?.canUseIikoIntegration ??
      features?.effective?.["integration.iiko"],
  );
}

export function canViewIikoOrderTimeline(params: {
  catalog: OrderPageCatalog | undefined;
  userRole?: string | null;
}): boolean {
  return (
    isCatalogManagerRole(params.userRole) &&
    catalogCanUseIikoOrderTimeline(params.catalog)
  );
}
