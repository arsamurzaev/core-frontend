import { getCatalogTypeCode } from "@/shared/lib/catalog-type";
import type {
  CatalogThemeConfig,
  CatalogThemePreset,
  CatalogThemePresetId,
} from "./metadata-contracts";

type CatalogThemeSource = {
  type?: {
    code?: string | null;
  } | null;
} | null | undefined;

type CatalogThemeExtensionSource = {
  theme?: CatalogThemeConfig;
};

type CatalogThemeRuntimeSource = {
  theme: CatalogThemePreset;
  typeCode: string;
};

export type CatalogThemeScopeAttributes = {
  "data-catalog-theme": CatalogThemePresetId;
  "data-catalog-type": string;
};

export const CATALOG_THEME_PRESETS = {
  default: {
    id: "default",
    label: "Default storefront",
    scopeClassName: "catalog-theme-default",
    tokenOverrides: {},
  },
  restaurant: {
    id: "restaurant",
    label: "Restaurant storefront",
    scopeClassName: "catalog-theme-restaurant",
    tokenOverrides: {},
  },
  wholesale: {
    id: "wholesale",
    label: "Wholesale storefront",
    scopeClassName: "catalog-theme-wholesale",
    tokenOverrides: {},
  },
} satisfies Record<CatalogThemePresetId, CatalogThemePreset>;

const CATALOG_THEME_PRESET_BY_TYPE_CODE: Partial<
  Record<string, CatalogThemePresetId>
> = {
  cafe: "restaurant",
  restaurant: "restaurant",
  wholesale: "wholesale",
  whosale: "wholesale",
};

export function resolveCatalogThemePreset(
  extension: CatalogThemeExtensionSource | null,
): CatalogThemePreset {
  return CATALOG_THEME_PRESETS[extension?.theme?.presetId ?? "default"];
}

export function resolveCatalogThemePresetByTypeCode(
  typeCode: string,
): CatalogThemePreset {
  return CATALOG_THEME_PRESETS[
    CATALOG_THEME_PRESET_BY_TYPE_CODE[typeCode] ?? "default"
  ];
}

export function resolveCatalogThemePresetForCatalog(
  catalog: CatalogThemeSource,
): CatalogThemePreset {
  return resolveCatalogThemePresetByTypeCode(getCatalogTypeCode(catalog));
}

export function getCatalogThemeScopeAttributes(
  runtime: CatalogThemeRuntimeSource,
): CatalogThemeScopeAttributes {
  return {
    "data-catalog-theme": runtime.theme.id,
    "data-catalog-type": runtime.typeCode || "default",
  };
}

export function getCatalogThemeScopeAttributesForCatalog(
  catalog: CatalogThemeSource,
): CatalogThemeScopeAttributes {
  const typeCode = getCatalogTypeCode(catalog);

  return {
    "data-catalog-theme": resolveCatalogThemePresetByTypeCode(typeCode).id,
    "data-catalog-type": typeCode || "default",
  };
}
