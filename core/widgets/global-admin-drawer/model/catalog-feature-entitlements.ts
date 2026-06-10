"use client";

import { apiClient } from "@/shared/api/client";
import {
  CATALOG_CAPABILITIES,
  type CatalogCapability,
  type CatalogCapabilityDefinition,
  type CatalogCapabilityItem,
  type CatalogCapabilityMap,
} from "@/shared/capabilities/catalog-capabilities";

export const CATALOG_FEATURES = CATALOG_CAPABILITIES;
export type CatalogFeature = CatalogCapability;

export type CatalogFeatureEntitlement = {
  feature: CatalogFeature;
  enabled: boolean;
  expiresAt: string | null;
  metadata: Record<string, unknown> | null;
};

export type CatalogFeatureEntitlementsResponse = {
  catalogId: string;
  definitions: CatalogCapabilityDefinition[];
  raw: CatalogCapabilityMap;
  effective: CatalogCapabilityMap;
  items: CatalogCapabilityItem[];
  features: CatalogFeatureEntitlement[];
};

export type UpdateCatalogFeatureEntitlementRequest = {
  feature: CatalogFeature;
  enabled: boolean;
  expiresAt?: string | null;
  metadata?: Record<string, unknown> | null;
};

export const CATALOG_FEATURE_LABELS: Record<
  CatalogFeature,
  { title: string; description: string }
> = {
  "product.types": {
    title: "Типы товаров",
    description: "Схемы свойств товара и подготовка вариаций.",
  },
  "product.variants": {
    title: "Вариации",
    description: "Матрица вариантов: размер, цвет и другие комбинации.",
  },
  "catalog.sale_units": {
    title: "Единицы продажи",
    description: "Единицы продажи внутри каталога: упаковка, коробка и другие.",
  },
  "catalog.modifiers": {
    title: "Модификаторы",
    description:
      "Группы добавок и опций товара: сыр, соусы и другие платные модификаторы.",
  },
  "catalog.price_lists": {
    title: "Прайс-листы",
    description: "Гибкие цены для родительских и дочерних торговых каталогов.",
  },
  "inventory.internal": {
    title: "Собственный склад",
    description: "Внутренние склады, остатки, движения и резервы.",
  },
  "integration.moysklad": {
    title: "МойСклад",
    description: "Синхронизация каталога, остатков и экспорт заказов.",
  },
  "integration.iiko": {
    title: "iiko",
    description:
      "Импорт меню iikoCloud: категории, товары, вариации и изображения.",
  },
  "integration.one_c": {
    title: "1C",
    description: "Настраиваемая интеграция 1C: API, объекты и маппинг полей.",
  },
};

export function getCatalogFeatureEntitlements(catalogId: string) {
  return apiClient.get<CatalogFeatureEntitlementsResponse>(
    `/admin/catalogs/${catalogId}/features`,
  );
}

export function updateCatalogFeatureEntitlement(
  catalogId: string,
  data: UpdateCatalogFeatureEntitlementRequest,
) {
  return apiClient.patch<CatalogFeatureEntitlementsResponse>(
    `/admin/catalogs/${catalogId}/features`,
    data,
  );
}
