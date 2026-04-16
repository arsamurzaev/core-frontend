import dynamic from "next/dynamic";
import type { BrowserProps, CatalogPlugin } from "../../core/contracts";

/**
 * Плагин для типов ресторан / кафе.
 *
 * Оба типа используют одинаковый UI: поиск без кнопки фильтра,
 * поисковая строка всегда развёрнута (stickySearchMode="inline").
 * Стандартная корзина без изменений.
 *
 * Структура папки:
 *   plugins/restaurant/
 *   ├── restaurant.plugin.ts   ← этот файл
 *   └── ui/
 *       ├── restaurant-browser.tsx
 *       └── restaurant-filter-bar.tsx
 */
const RestaurantBrowser = dynamic<BrowserProps>(
  () => import("./ui/restaurant-browser").then((m) => m.RestaurantBrowser),
);

export const restaurantPlugin: CatalogPlugin = {
  typeCode: ["restaurant", "cafe"],
  browser: {
    Component: RestaurantBrowser,
  },
};
