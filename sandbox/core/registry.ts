import { defaultPlugin } from "../plugins/default/default.plugin";
import { restaurantPlugin } from "../plugins/restaurant/restaurant.plugin";
import { wholesalePlugin } from "../plugins/wholesale/wholesale.plugin";
import type { CatalogPlugin } from "./contracts";

export const CATALOG_PLUGINS: CatalogPlugin[] = [
  restaurantPlugin,
  wholesalePlugin,
  defaultPlugin,
];
