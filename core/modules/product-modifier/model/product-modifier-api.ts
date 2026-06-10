"use client";

import { apiClient } from "@/shared/api/client";
import { useQuery } from "@tanstack/react-query";
import type {
  CatalogModifierGroup,
  CatalogModifierState,
  CatalogModifierOption,
  ProductModifierGroup,
} from "./product-modifier-types";

export type CatalogModifierListFilters = {
  includeArchived?: boolean;
  includeInactive?: boolean;
};

export type CatalogModifierGroupOptionPayload = {
  optionId: string;
  defaultPrice?: number | null;
  isDefault?: boolean;
  isActive?: boolean;
  displayOrder?: number;
};

export type CatalogModifierGroupPayload = {
  code?: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  isRequired?: boolean;
  maxSelected?: number | null;
  minSelected?: number;
  name?: string;
  options?: CatalogModifierGroupOptionPayload[];
};

export type CreateCatalogModifierGroupPayload =
  CatalogModifierGroupPayload & {
    name: string;
  };

export type CatalogModifierOptionPayload = {
  code?: string;
  defaultPrice?: number;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  name?: string;
};

export type CreateCatalogModifierOptionPayload =
  CatalogModifierOptionPayload & {
    name: string;
  };

export type ProductModifierOptionBindingPayload = {
  catalogModifierOptionId?: string;
  code?: string;
  displayOrder?: number;
  isAvailable?: boolean;
  isDefault?: boolean;
  maxQuantity?: number | null;
  name?: string;
  price?: number;
};

export type ProductModifierGroupBindingPayload = {
  catalogModifierGroupId?: string;
  code?: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  isRequired?: boolean;
  maxSelected?: number | null;
  minSelected?: number;
  name?: string;
  options?: ProductModifierOptionBindingPayload[];
  variantId?: string | null;
};

export const productModifierQueryKeys = {
  all: ["catalog-modifier"] as const,
  state: (filters: CatalogModifierListFilters = {}) =>
    ["catalog-modifier", "state", filters] as const,
  groups: (filters: CatalogModifierListFilters = {}) =>
    ["catalog-modifier", "groups", filters] as const,
  options: (filters: CatalogModifierListFilters = {}) =>
    ["catalog-modifier", "options", filters] as const,
  product: (productId: string) =>
    ["catalog-modifier", "product", productId] as const,
};

function buildModifierEndpoint(
  path: string,
  filters: CatalogModifierListFilters = {},
): string {
  const params = new URLSearchParams();

  if (filters.includeArchived) {
    params.set("includeArchived", "true");
  }
  if (filters.includeInactive) {
    params.set("includeInactive", "true");
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function getCatalogModifierState(
  filters: CatalogModifierListFilters = {},
): Promise<CatalogModifierState> {
  return apiClient.get<CatalogModifierState>(
    buildModifierEndpoint("/catalog-modifier", filters),
  );
}

export function getCatalogModifierGroups(
  filters: CatalogModifierListFilters = {},
): Promise<CatalogModifierGroup[]> {
  return apiClient.get<CatalogModifierGroup[]>(
    buildModifierEndpoint("/catalog-modifier/groups", filters),
  );
}

export function createCatalogModifierGroup(
  payload: CreateCatalogModifierGroupPayload,
): Promise<CatalogModifierGroup> {
  return apiClient.post<CatalogModifierGroup>(
    "/catalog-modifier/groups",
    payload,
  );
}

export function updateCatalogModifierGroup(params: {
  id: string;
  payload: CatalogModifierGroupPayload;
}): Promise<CatalogModifierGroup> {
  return apiClient.patch<CatalogModifierGroup>(
    `/catalog-modifier/groups/${encodeURIComponent(params.id)}`,
    params.payload,
  );
}

export function archiveCatalogModifierGroup(
  id: string,
): Promise<{ ok: boolean }> {
  return apiClient.delete<{ ok: boolean }>(
    `/catalog-modifier/groups/${encodeURIComponent(id)}`,
  );
}

export function getCatalogModifierOptions(
  filters: CatalogModifierListFilters = {},
): Promise<CatalogModifierOption[]> {
  return apiClient.get<CatalogModifierOption[]>(
    buildModifierEndpoint("/catalog-modifier/options", filters),
  );
}

export function createCatalogModifierOption(
  payload: CreateCatalogModifierOptionPayload,
): Promise<CatalogModifierOption> {
  return apiClient.post<CatalogModifierOption>(
    "/catalog-modifier/options",
    payload,
  );
}

export function updateCatalogModifierOption(params: {
  id: string;
  payload: CatalogModifierOptionPayload;
}): Promise<CatalogModifierOption> {
  return apiClient.patch<CatalogModifierOption>(
    `/catalog-modifier/options/${encodeURIComponent(params.id)}`,
    params.payload,
  );
}

export function archiveCatalogModifierOption(
  id: string,
): Promise<{ ok: boolean }> {
  return apiClient.delete<{ ok: boolean }>(
    `/catalog-modifier/options/${encodeURIComponent(id)}`,
  );
}

export function getProductModifiers(
  productId: string,
): Promise<ProductModifierGroup[]> {
  return apiClient.get<ProductModifierGroup[]>(
    `/catalog-modifier/products/${encodeURIComponent(productId)}`,
  );
}

export function setProductModifiers(params: {
  productId: string;
  groups: ProductModifierGroupBindingPayload[];
}): Promise<ProductModifierGroup[]> {
  return apiClient.put<ProductModifierGroup[]>(
    `/catalog-modifier/products/${encodeURIComponent(params.productId)}`,
    { groups: params.groups },
  );
}

export function useCatalogModifierState(
  filters: CatalogModifierListFilters = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: productModifierQueryKeys.state(filters),
    queryFn: () => getCatalogModifierState(filters),
    enabled: options.enabled !== false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useProductModifiers(
  productId: string | null | undefined,
  options: { enabled?: boolean } = {},
) {
  const normalizedProductId = productId?.trim() ?? "";

  return useQuery({
    queryKey: productModifierQueryKeys.product(normalizedProductId),
    queryFn: () => getProductModifiers(normalizedProductId),
    enabled: Boolean(normalizedProductId) && options.enabled !== false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
