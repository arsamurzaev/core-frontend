"use client";

import {
  type CatalogCurrentFeaturesDto,
  type CatalogCurrentFeaturesDtoInventoryMode,
  useCatalogAdvancedSettingsControllerGetIikoStatus,
  useCatalogAdvancedSettingsControllerGetMoySkladStatus,
  useCatalogControllerGetCurrentFeatures,
} from "@/shared/api/generated/react-query";
import {
  isCatalogManagerRole,
  isGlobalAdminRole,
} from "@/shared/lib/catalog-role";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { useSession } from "@/shared/providers/session-provider";

export const CATALOG_CAPABILITIES = [
  "product.types",
  "product.variants",
  "catalog.sale_units",
  "catalog.modifiers",
  "catalog.price_lists",
  "inventory.internal",
  "integration.moysklad",
  "integration.iiko",
  "integration.one_c",
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
  canUseCatalogModifiers: boolean;
  canUseCatalogPriceLists: boolean;
  canUseInternalInventory: boolean;
  canUseMoySkladIntegration: boolean;
  canUseIikoIntegration: boolean;
  canUseOneCIntegration: boolean;
};

export type CatalogCapabilities = CatalogCapabilityFlags & {
  raw: CatalogCapabilityMap;
  effective: CatalogCapabilityMap;
  definitions: CatalogCapabilityDefinition[];
  items: CatalogCapabilityItem[];
};
type ProductStructureCapabilityFlags = Pick<
  CatalogCapabilityFlags,
  | "canUseIikoIntegration"
  | "canUseMoySkladIntegration"
  | "canUseProductTypes"
  | "canUseProductVariants"
>;
export type CatalogProductStructureVisibility = {
  canUseProductTypes: boolean;
  canUseProductVariants: boolean;
  hideProductStructureControls: boolean;
};
export type CatalogBetaField =
  | "internalInventory"
  | "iikoIntegration"
  | "moyskladIntegration"
  | "oneCIntegration"
  | "modifiers"
  | "priceLists"
  | "productTypes"
  | "productVariants"
  | "saleUnits";

type CatalogFeaturesTransport = Omit<
  Partial<CatalogCurrentFeaturesDto>,
  "raw" | "effective" | "definitions" | "items"
> & {
  canUseCatalogModifiers?: boolean;
  canUseCatalogPriceLists?: boolean;
  raw?: Record<string, boolean> | null;
  effective?: Record<string, boolean> | null;
  definitions?: Array<Record<string, unknown>> | null;
  items?: Array<Record<string, unknown>> | null;
};

export const DEFAULT_CAPABILITY_MAP: CatalogCapabilityMap = {
  "product.types": false,
  "product.variants": false,
  "catalog.sale_units": false,
  "catalog.modifiers": false,
  "catalog.price_lists": false,
  "inventory.internal": false,
  "integration.moysklad": false,
  "integration.iiko": false,
  "integration.one_c": false,
};

export const DEFAULT_CATALOG_CAPABILITIES: CatalogCapabilities = {
  inventoryMode: "NONE",
  canUseProductTypes: false,
  canUseProductVariants: false,
  canUseCatalogSaleUnits: false,
  canUseCatalogModifiers: false,
  canUseCatalogPriceLists: false,
  canUseInternalInventory: false,
  canUseMoySkladIntegration: false,
  canUseIikoIntegration: false,
  canUseOneCIntegration: false,
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
    canUseCatalogModifiers:
      features?.canUseCatalogModifiers ?? effective["catalog.modifiers"],
    canUseCatalogPriceLists:
      features?.canUseCatalogPriceLists ?? effective["catalog.price_lists"],
    canUseInternalInventory:
      features?.canUseInternalInventory ?? effective["inventory.internal"],
    canUseMoySkladIntegration:
      features?.canUseMoySkladIntegration ?? effective["integration.moysklad"],
    canUseIikoIntegration:
      features?.canUseIikoIntegration ?? effective["integration.iiko"],
    canUseOneCIntegration:
      features?.canUseOneCIntegration ?? effective["integration.one_c"],
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

export function shouldHideProductStructureControlsForCatalogManager(params: {
  capabilities: Pick<
    ProductStructureCapabilityFlags,
    "canUseIikoIntegration" | "canUseMoySkladIntegration"
  >;
  iikoConfigured?: boolean;
  moySkladConfigured?: boolean;
  userRole?: string | null;
}): boolean {
  if (isGlobalAdminRole(params.userRole)) {
    return false;
  }

  const hasConfiguredExternalMenu =
    (params.capabilities.canUseMoySkladIntegration &&
      params.moySkladConfigured !== false) ||
    (params.capabilities.canUseIikoIntegration &&
      params.iikoConfigured !== false);

  return isCatalogManagerRole(params.userRole) && hasConfiguredExternalMenu;
}

export function resolveCatalogProductStructureVisibility(
  capabilities: ProductStructureCapabilityFlags,
  hideProductStructureControls: boolean,
): CatalogProductStructureVisibility {
  return {
    canUseProductTypes:
      capabilities.canUseProductTypes && !hideProductStructureControls,
    canUseProductVariants:
      capabilities.canUseProductVariants && !hideProductStructureControls,
    hideProductStructureControls,
  };
}

export function useCatalogProductStructureVisibility(
  capabilities: ProductStructureCapabilityFlags,
): CatalogProductStructureVisibility {
  const { isAuthenticated, user } = useSession();
  const canManageCatalog = isCatalogManagerRole(user?.role);
  const shouldCheckMoySkladStatus =
    isAuthenticated &&
    canManageCatalog &&
    capabilities.canUseMoySkladIntegration;
  const shouldCheckIikoStatus =
    isAuthenticated && canManageCatalog && capabilities.canUseIikoIntegration;
  const moySkladStatusQuery =
    useCatalogAdvancedSettingsControllerGetMoySkladStatus({
      query: {
        enabled: shouldCheckMoySkladStatus,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
      },
    });
  const iikoStatusQuery = useCatalogAdvancedSettingsControllerGetIikoStatus({
    query: {
      enabled: shouldCheckIikoStatus,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });
  const hideProductStructureControls =
    shouldHideProductStructureControlsForCatalogManager({
      capabilities,
      iikoConfigured: shouldCheckIikoStatus
        ? iikoStatusQuery.data?.configured
        : false,
      moySkladConfigured: shouldCheckMoySkladStatus
        ? moySkladStatusQuery.data?.configured
        : false,
      userRole: user?.role,
    });

  return resolveCatalogProductStructureVisibility(
    capabilities,
    hideProductStructureControls,
  );
}

export function canShowProductTypes(
  capabilities: Pick<CatalogCapabilities, "canUseProductTypes">,
): boolean {
  return capabilities.canUseProductTypes;
}

export function canShowVariants(
  capabilities: Pick<CatalogCapabilities, "canUseProductVariants">,
): boolean {
  return capabilities.canUseProductVariants;
}

export function canShowSaleUnits(
  capabilities: Pick<CatalogCapabilities, "canUseCatalogSaleUnits">,
): boolean {
  return capabilities.canUseCatalogSaleUnits;
}

export function canShowModifiers(
  capabilities: Pick<CatalogCapabilities, "canUseCatalogModifiers">,
): boolean {
  return capabilities.canUseCatalogModifiers;
}

export function canUseInternalInventory(
  capabilities: Pick<CatalogCapabilities, "canUseInternalInventory">,
): boolean {
  return capabilities.canUseInternalInventory;
}

export function canShowMoySklad(
  capabilities: Pick<CatalogCapabilities, "canUseMoySkladIntegration">,
): boolean {
  return capabilities.canUseMoySkladIntegration;
}

export function canShowIiko(
  capabilities: Pick<CatalogCapabilities, "canUseIikoIntegration">,
): boolean {
  return capabilities.canUseIikoIntegration;
}

export function canShowOneC(
  capabilities: Pick<CatalogCapabilities, "canUseOneCIntegration">,
): boolean {
  return capabilities.canUseOneCIntegration;
}

export function canShowBetaField(
  capabilities: Pick<
    CatalogCapabilities,
    | "canUseCatalogSaleUnits"
    | "canUseIikoIntegration"
    | "canUseCatalogModifiers"
    | "canUseCatalogPriceLists"
    | "canUseInternalInventory"
    | "canUseMoySkladIntegration"
    | "canUseOneCIntegration"
    | "canUseProductTypes"
    | "canUseProductVariants"
  >,
  field: CatalogBetaField,
): boolean {
  switch (field) {
    case "internalInventory":
      return capabilities.canUseInternalInventory;
    case "iikoIntegration":
      return capabilities.canUseIikoIntegration;
    case "moyskladIntegration":
      return capabilities.canUseMoySkladIntegration;
    case "oneCIntegration":
      return capabilities.canUseOneCIntegration;
    case "modifiers":
      return capabilities.canUseCatalogModifiers;
    case "priceLists":
      return capabilities.canUseCatalogPriceLists;
    case "productTypes":
      return capabilities.canUseProductTypes;
    case "productVariants":
      return capabilities.canUseProductVariants;
    case "saleUnits":
      return capabilities.canUseCatalogSaleUnits;
  }
}
