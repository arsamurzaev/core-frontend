import { apiClient } from "@/shared/api/client";
import type { CatalogSaleUnitDto } from "@/shared/api/generated/react-query";

export type CatalogSaleUnitListFilters = {
  includeArchived?: boolean;
  includeInactive?: boolean;
};

export type CatalogSaleUnitCreatePayload = {
  displayOrder?: number;
  name: string;
};

export type CatalogSaleUnitUpdatePayload = {
  displayOrder?: number;
  isActive?: boolean;
  name?: string;
};

const ADVANCED_SALE_UNITS_ENDPOINT =
  "/catalog/current/advanced-settings/sale-units";

export const ADVANCED_SALE_UNITS_QUERY_KEY = [
  "catalog-advanced-settings",
  "sale-units",
] as const;

function buildSaleUnitsEndpoint(filters: CatalogSaleUnitListFilters): string {
  const params = new URLSearchParams();

  if (filters.includeInactive) {
    params.set("includeInactive", "true");
  }
  if (filters.includeArchived) {
    params.set("includeArchived", "true");
  }

  const query = params.toString();
  return query
    ? `${ADVANCED_SALE_UNITS_ENDPOINT}?${query}`
    : ADVANCED_SALE_UNITS_ENDPOINT;
}

export function listAdvancedCatalogSaleUnits(
  filters: CatalogSaleUnitListFilters = {},
): Promise<CatalogSaleUnitDto[]> {
  return apiClient.get<CatalogSaleUnitDto[]>(buildSaleUnitsEndpoint(filters));
}

export function createAdvancedCatalogSaleUnit(
  payload: CatalogSaleUnitCreatePayload,
): Promise<CatalogSaleUnitDto> {
  return apiClient.post<CatalogSaleUnitDto>(
    ADVANCED_SALE_UNITS_ENDPOINT,
    payload,
  );
}

export function updateAdvancedCatalogSaleUnit(params: {
  id: string;
  payload: CatalogSaleUnitUpdatePayload;
}): Promise<CatalogSaleUnitDto> {
  return apiClient.patch<CatalogSaleUnitDto>(
    `${ADVANCED_SALE_UNITS_ENDPOINT}/${params.id}`,
    params.payload,
  );
}

export function archiveAdvancedCatalogSaleUnit(id: string): Promise<{ ok: boolean }> {
  return apiClient.delete<{ ok: boolean }>(
    `${ADVANCED_SALE_UNITS_ENDPOINT}/${id}`,
  );
}
