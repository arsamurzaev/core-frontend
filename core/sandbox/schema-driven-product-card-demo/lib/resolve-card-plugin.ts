import type { CatalogTypeDto } from "@/shared/api/generated";
import { PRODUCT_CARD_SCHEMAS } from "../model/schema";
import type { CatalogKind } from "../model/types";
import { detectCatalogKind } from "./attribute-utils";
import { defaultProductCardPlugin } from "../plugins/default.plugin";
import { productCardPlugins } from "../plugins/registry";

interface ProductCardRuntime {
  kind: CatalogKind;
  pluginId: string;
  plugin: (typeof productCardPlugins)[number];
  schema: (typeof PRODUCT_CARD_SCHEMAS)[CatalogKind];
}

export function resolveProductCardRuntime(
  catalogType: CatalogTypeDto,
  forceKind?: CatalogKind,
): ProductCardRuntime {
  const kind = forceKind ?? detectCatalogKind(catalogType);
  const schema = PRODUCT_CARD_SCHEMAS[kind];

  const forcedPlugin = productCardPlugins.find((plugin) => plugin.kind === kind);
  if (forcedPlugin) {
    return {
      kind,
      pluginId: forcedPlugin.id,
      plugin: forcedPlugin,
      schema,
    };
  }

  const matchedPlugin =
    productCardPlugins.find((plugin) => plugin.matches(catalogType)) ??
    defaultProductCardPlugin;

  return {
    kind,
    pluginId: matchedPlugin.id,
    plugin: matchedPlugin,
    schema,
  };
}
