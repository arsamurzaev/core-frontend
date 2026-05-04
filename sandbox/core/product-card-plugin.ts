import type {
  ProductCardPluginConfig,
  ResolvedProductCardPlugin,
} from "@/core/modules/product/plugins/contracts";

const CAFE_BEAN_ORIGIN_KEY = "cafe_bean_origin";
const OUTERWEAR_SIZE_KEY = "outerwear_size";

const DEFAULT_PRODUCT_CARD_PLUGIN_CONFIG: ProductCardPluginConfig = {
  attributes: [],
  showVariants: true,
  badges: [],
};

const PRODUCT_CARD_PLUGIN_CONFIGS: Record<string, ProductCardPluginConfig> = {
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

export function resolveProductCardPlugin(
  typeCode: string | null | undefined,
): ResolvedProductCardPlugin {
  const normalized = typeCode?.toLowerCase().trim();
  const config = normalized
    ? PRODUCT_CARD_PLUGIN_CONFIGS[normalized]
    : undefined;
  const mergedConfig = config ?? DEFAULT_PRODUCT_CARD_PLUGIN_CONFIG;

  return {
    key: normalized || "default",
    attributes: mergedConfig.attributes,
    showVariants: mergedConfig.showVariants ?? true,
    badges: mergedConfig.badges ?? [],
  };
}
