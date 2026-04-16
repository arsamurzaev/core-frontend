"use client";

import { useCatalogState } from "@/shared/providers/catalog-provider";
import { CATALOG_PLUGINS } from "./registry";
import type { CatalogPlugin } from "./contracts";

/**
 * Возвращает плагин для текущего типа каталога, или undefined если плагин не зарегистрирован.
 *
 * Матчинг по CatalogTypeDto.code — строгое совпадение или вхождение в массив typeCode.
 * Если плагин не найден — компоненты-потребители (CatalogBrowser, PluginCartDrawer)
 * автоматически падают обратно на core-дефолты.
 *
 * Используется через useCatalogPluginRuntime, напрямую — редко.
 */
export function useCatalogPlugin(): CatalogPlugin | undefined {
  const { catalog } = useCatalogState();
  const typeCode = catalog?.type.code;

  if (!typeCode) return undefined;

  return CATALOG_PLUGINS.find((p) =>
    Array.isArray(p.typeCode)
      ? p.typeCode.includes(typeCode)
      : p.typeCode === typeCode,
  );
}
