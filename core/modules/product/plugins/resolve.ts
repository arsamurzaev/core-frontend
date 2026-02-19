import type { ResolvedProductCardPlugin } from "./contracts";
import {
  DEFAULT_PRODUCT_CARD_PLUGIN_CONFIG,
  PRODUCT_CARD_PLUGIN_CONFIGS,
} from "./registry";

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
