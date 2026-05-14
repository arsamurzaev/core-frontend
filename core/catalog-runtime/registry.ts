import { restaurantExtension } from "./extensions/restaurant/restaurant.extension";
import { wholesaleExtension } from "./extensions/wholesale/wholesale.extension";
import type { CatalogExtension } from "./contracts";

export const CATALOG_EXTENSIONS: CatalogExtension[] = [
  restaurantExtension,
  wholesaleExtension,
];

export const CATALOG_PLUGINS = CATALOG_EXTENSIONS;
