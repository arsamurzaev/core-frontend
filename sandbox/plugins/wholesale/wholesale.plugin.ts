import dynamic from "next/dynamic";
import type { CatalogPlugin } from "../../core/contracts";

/**
 * Плагин для оптового каталога.
 *
 * Заменяет стандартный счётчик +/− в карточке корзины на spinbox
 * с текстовым полем ввода (1–999). Удобно для оптовых заказов,
 * где нужно вводить конкретное количество.
 * Стандартный Browser без изменений.
 *
 * Структура папки:
 *   plugins/wholesale/
 *   ├── wholesale.plugin.ts          ← этот файл
 *   └── ui/
 *       ├── wholesale-cart-card-action.tsx
 *       └── quantity-spinbox.tsx
 */
const WholesaleCartCardAction = dynamic(
  () => import("./ui/wholesale-cart-card-action").then((m) => m.WholesaleCartCardAction),
  { ssr: false },
);

export const wholesalePlugin: CatalogPlugin = {
  typeCode: "wholesale",
  cart: {
    CardAction: WholesaleCartCardAction,
  },
};
