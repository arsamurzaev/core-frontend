import dynamic from "next/dynamic";
import type {
  BrowserSlotProps,
  CatalogExtension,
} from "@/core/catalog-runtime/contracts";

const RestaurantBrowser = dynamic<BrowserSlotProps>(() =>
  import("./ui/restaurant-browser").then((module) => module.RestaurantBrowser),
);

export const restaurantExtension: CatalogExtension = {
  typeCode: ["restaurant", "cafe"],
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
  slots: {
    Browser: RestaurantBrowser,
  },
};
