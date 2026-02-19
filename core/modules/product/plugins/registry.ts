import { CAFE_BEAN_ORIGIN_KEY, OUTERWEAR_SIZE_KEY } from "./constants";
import type { ProductCardPluginConfig } from "./contracts";

export const DEFAULT_PRODUCT_CARD_PLUGIN_CONFIG: ProductCardPluginConfig = {
  attributes: [],
  showVariants: true,
  badges: [],
};

export const PRODUCT_CARD_PLUGIN_CONFIGS: Record<
  string,
  ProductCardPluginConfig
> = {
  cafe: {
    attributes: [
      {
        key: CAFE_BEAN_ORIGIN_KEY,
        fallbackLabel: "Размер зерна",
        fallbackValue: "Не указан",
      },
    ],
    showVariants: true,
    badges: ["Cafe"],
  },
  cloth: {
    attributes: [
      {
        key: OUTERWEAR_SIZE_KEY,
        fallbackLabel: "Размер",
        fallbackValue: "Не указан",
      },
    ],
    showVariants: true,
    badges: ["Cloth"],
  },
};
