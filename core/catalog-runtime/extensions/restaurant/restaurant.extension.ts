import dynamic from "next/dynamic";
import type { BrowserSlotProps } from "@/core/catalog-runtime/slot-contracts";
import type { CatalogExtension } from "@/core/catalog-runtime/runtime-contracts";

const RestaurantBrowser = dynamic<BrowserSlotProps>(() =>
  import("./ui/restaurant-browser").then((module) => module.RestaurantBrowser),
);

export const restaurantExtension: CatalogExtension = {
  typeCode: ["restaurant", "cafe"],
  manifest: {
    id: "restaurant",
    label: "Restaurant storefront",
    analyticsEvents: ["checkout.preorderStart"],
  },
  presentation: {
    catalogTabLabel: "Меню",
    categoryAdminCreateDescription:
      "Создайте новую категорию, чтобы она сразу появилась в меню и в карточках выбора.",
    categoryAdminEditDescription:
      "Измените название категории. Обновление сразу попадет в меню.",
    categoryCardVariant: "compact",
    copySuccessMessage: "Ссылка на меню скопирована",
    shareButtonLabel: "Поделиться меню",
    supportsBrands: false,
    supportsCategoryDetails: false,
  },
  checkout: {
    availableMethods: ["DELIVERY", "PICKUP", "PREORDER"],
    defaultEnabledMethods: ["DELIVERY", "PICKUP"],
  },
  theme: {
    presetId: "restaurant",
  },
  slots: {
    Browser: RestaurantBrowser,
  },
};
