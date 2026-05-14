"use client";

import {
  type CatalogCurrentFeaturesDto,
  type CatalogCurrentFeaturesDtoInventoryMode,
  useCatalogControllerGetCurrentFeatures,
} from "@/shared/api/generated/react-query";
import { isCatalogManagerRole } from "@/shared/lib/catalog-role";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { useSession } from "@/shared/providers/session-provider";

export const CATALOG_CAPABILITIES = [
  "product.types",
  "product.variants",
  "catalog.sale_units",
  "inventory.internal",
  "integration.moysklad",
] as const;

export type CatalogCapability = (typeof CATALOG_CAPABILITIES)[number];
export type CatalogCapabilityMap = Record<CatalogCapability, boolean>;

export type CatalogCapabilityDefinition = {
  key: CatalogCapability;
  title: string;
  description: string;
  dependsOn: CatalogCapability[];
};

export type CatalogCapabilityItem = {
  key: CatalogCapability;
  raw: boolean;
  effective: boolean;
  disabledReason: string | null;
};

export type CatalogCapabilityFlags = {
  inventoryMode: CatalogCurrentFeaturesDtoInventoryMode;
  canUseProductTypes: boolean;
  canUseProductVariants: boolean;
  canUseCatalogSaleUnits: boolean;
  canUseInternalInventory: boolean;
  canUseMoySkladIntegration: boolean;
};

export type CatalogCapabilities = CatalogCapabilityFlags & {
  raw: CatalogCapabilityMap;
  effective: CatalogCapabilityMap;
  definitions: CatalogCapabilityDefinition[];
  items: CatalogCapabilityItem[];
};

type CatalogFeaturesTransport = Omit<
  Partial<CatalogCurrentFeaturesDto>,
  "raw" | "effective" | "definitions" | "items"
> & {
  raw?: Record<string, boolean> | null;
  effective?: Record<string, boolean> | null;
  definitions?: Array<Record<string, unknown>> | null;
  items?: Array<Record<string, unknown>> | null;
};

export const DEFAULT_CAPABILITY_MAP: CatalogCapabilityMap = {
  "product.types": false,
  "product.variants": false,
  "catalog.sale_units": false,
  "inventory.internal": false,
  "integration.moysklad": false,
};

export const DEFAULT_CATALOG_CAPABILITIES: CatalogCapabilities = {
  inventoryMode: "NONE",
  canUseProductTypes: false,
  canUseProductVariants: false,
  canUseCatalogSaleUnits: false,
  canUseInternalInventory: false,
  canUseMoySkladIntegration: false,
  raw: DEFAULT_CAPABILITY_MAP,
  effective: DEFAULT_CAPABILITY_MAP,
  definitions: [],
  items: [],
};

function normalizeCapabilityMap(
  value?: Record<string, boolean> | null,
): CatalogCapabilityMap {
  return Object.fromEntries(
    CATALOG_CAPABILITIES.map((capability) => [
      capability,
      value?.[capability] ?? false,
    ]),
  ) as CatalogCapabilityMap;
}

function isKnownCapability(value: unknown): value is CatalogCapability {
  return (
    typeof value === "string" &&
    (CATALOG_CAPABILITIES as readonly string[]).includes(value)
  );
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function resolveCatalogCapabilities(
  features?: CatalogFeaturesTransport | null,
): CatalogCapabilities {
  const effective = normalizeCapabilityMap(features?.effective);
  const raw = normalizeCapabilityMap(features?.raw ?? features?.effective);

  return {
    inventoryMode:
      features?.inventoryMode ?? DEFAULT_CATALOG_CAPABILITIES.inventoryMode,
    canUseProductTypes:
      features?.canUseProductTypes ?? effective["product.types"],
    canUseProductVariants:
      features?.canUseProductVariants ?? effective["product.variants"],
    canUseCatalogSaleUnits:
      features?.canUseCatalogSaleUnits ?? effective["catalog.sale_units"],
    canUseInternalInventory:
      features?.canUseInternalInventory ?? effective["inventory.internal"],
    canUseMoySkladIntegration:
      features?.canUseMoySkladIntegration ?? effective["integration.moysklad"],
    raw,
    effective,
    definitions:
      features?.definitions
        ?.filter((definition) => isKnownCapability(definition.key))
        .map((definition) => ({
          key: definition.key as CatalogCapability,
          title: readString(definition.title),
          description: readString(definition.description),
          dependsOn: readStringArray(definition.dependsOn).filter(
            isKnownCapability,
          ),
        })) ?? [],
    items:
      features?.items
        ?.filter((item) => isKnownCapability(item.key))
        .map((item) => ({
          key: item.key as CatalogCapability,
          raw: readBoolean(item.raw),
          effective: readBoolean(item.effective),
          disabledReason:
            typeof item.disabledReason === "string"
              ? item.disabledReason
              : null,
        })) ?? [],
  };
}

interface ShouldRequestCatalogCapabilitiesOptions {
  hasCatalog: boolean;
  isAuthenticated: boolean;
  userRole?: string | null;
}

export function shouldRequestCatalogCapabilities({
  hasCatalog,
  isAuthenticated,
  userRole,
}: ShouldRequestCatalogCapabilitiesOptions): boolean {
  return hasCatalog && isAuthenticated && isCatalogManagerRole(userRole);
}

export function useCatalogCapabilities(): CatalogCapabilities {
  const { catalog, hasCatalog } = useCatalogState();
  const { isAuthenticated, user } = useSession();
  const query = useCatalogControllerGetCurrentFeatures({
    query: {
      enabled: shouldRequestCatalogCapabilities({
        hasCatalog,
        isAuthenticated,
        userRole: user?.role,
      }),
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });

  return resolveCatalogCapabilities(query.data ?? catalog?.features);
}

export const useCatalogFeatures = useCatalogCapabilities;
export const resolveCatalogFeatures = resolveCatalogCapabilities;
export type CatalogFeatureFlags = CatalogCapabilityFlags;
