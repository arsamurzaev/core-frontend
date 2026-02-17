import { clothingProductCardPlugin } from "./clothing.plugin";
import { defaultProductCardPlugin } from "./default.plugin";
import { restaurantProductCardPlugin } from "./restaurant.plugin";
import type { ProductCardPlugin } from "./contracts";

export const productCardPlugins: ProductCardPlugin[] = [
  restaurantProductCardPlugin,
  clothingProductCardPlugin,
  defaultProductCardPlugin,
];
