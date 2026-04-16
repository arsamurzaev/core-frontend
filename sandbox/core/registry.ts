import { restaurantPlugin } from "../plugins/restaurant/restaurant.plugin";
import { wholesalePlugin } from "../plugins/wholesale/wholesale.plugin";
import type { CatalogPlugin } from "./contracts";

/**
 * Реестр плагинов каталога.
 *
 * Порядок в массиве не важен — поиск по typeCode, не по позиции.
 * Если для типа каталога плагин не найден, весь UI остаётся дефолтным (core).
 *
 * Чтобы добавить новый тип:
 *   1. Создать папку plugins/<type>/
 *   2. Написать <type>.plugin.ts (см. contracts.ts для примеров)
 *   3. Добавить импорт и строку в этот массив — больше ничего.
 *
 * @example
 * ```ts
 * import { b2bPlugin } from "../plugins/b2b/b2b.plugin";
 *
 * export const CATALOG_PLUGINS: CatalogPlugin[] = [
 *   restaurantPlugin,
 *   wholesalePlugin,
 *   b2bPlugin, // ← добавить сюда
 * ];
 * ```
 */
export const CATALOG_PLUGINS: CatalogPlugin[] = [
  restaurantPlugin,
  wholesalePlugin,
];
