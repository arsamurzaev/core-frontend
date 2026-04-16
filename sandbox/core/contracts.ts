import type { CategoryDto } from "@/shared/api/generated/react-query";
import type React from "react";

export interface BrowserProps {
  className?: string;
  initialCategories?: CategoryDto[];
}

/**
 * Плагин для типа каталога.
 *
 * Каждый тип каталога (restaurant, wholesale, b2b и т.д.) может переопределять
 * отдельные части UI через слоты. Если слот не задан — используется дефолтный
 * core-компонент. Если плагин для типа не найден — весь UI остаётся дефолтным.
 *
 * Слоты разбиты по зонам: browser (каталог/категории) и cart (корзина).
 * Добавление новой зоны — новое поле здесь + новый slot-компонент в core.
 *
 * @example Минимальный плагин (только кастомный browser):
 * ```ts
 * export const myPlugin: CatalogPlugin = {
 *   typeCode: "my_type",
 *   browser: {
 *     Component: dynamic(() => import("./ui/my-browser").then((m) => m.MyBrowser)),
 *   },
 * };
 * ```
 *
 * @example Плагин с несколькими typeCode (общий UI для похожих типов):
 * ```ts
 * export const cafePlugin: CatalogPlugin = {
 *   typeCode: ["cafe", "restaurant", "food_court"],
 *   browser: {
 *     Component: dynamic(() => import("./ui/cafe-browser").then((m) => m.CafeBrowser)),
 *   },
 * };
 * ```
 *
 * @example Плагин только с кастомным действием в карточке корзины:
 * ```ts
 * export const b2bPlugin: CatalogPlugin = {
 *   typeCode: "b2b",
 *   cart: {
 *     CardAction: dynamic(
 *       () => import("./ui/b2b-cart-action").then((m) => m.B2bCartAction),
 *       { ssr: false },
 *     ),
 *   },
 * };
 * ```
 *
 * @example Плагин с обоими слотами:
 * ```ts
 * export const fullPlugin: CatalogPlugin = {
 *   typeCode: ["b2b", "distributor"],
 *   browser: {
 *     Component: dynamic(() => import("./ui/b2b-browser").then((m) => m.B2bBrowser)),
 *   },
 *   cart: {
 *     CardAction: dynamic(
 *       () => import("./ui/b2b-cart-action").then((m) => m.B2bCartAction),
 *       { ssr: false },
 *     ),
 *   },
 * };
 * ```
 */
export interface CatalogPlugin {
  /**
   * Код типа каталога из CatalogTypeDto.code.
   * Принимает строку или массив строк — если несколько типов
   * используют одинаковый UI.
   */
  typeCode: string | string[];

  /**
   * Слоты зоны каталога (Browser — главный экран с товарами и категориями).
   * Если не задан — рендерится стандартный core/Browser.
   */
  browser?: {
    /** Полностью заменяет core Browser для данного типа. */
    Component: React.ComponentType<BrowserProps>;
  };

  /**
   * Слоты зоны корзины.
   * Если не задан — корзина работает в стандартном режиме.
   */
  cart?: {
    /**
     * Заменяет кнопку +/− в карточке товара внутри корзины.
     * Получает productId и сам решает что рендерить (spinbox, кастомный счётчик и т.д.).
     * Рендерится только для не-менеджерских ролей.
     */
    CardAction?: React.ComponentType<{ productId: string }>;
  };
}
