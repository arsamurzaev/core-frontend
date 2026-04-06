import type { CatalogPlugin } from "../../core/contracts";
import { RestaurantBrowser } from "./ui/restaurant-browser";

export const restaurantPlugin: CatalogPlugin = {
  typeCode: "restaurant",
  filterAccess: "admin",
  showTabToggle: false,
  Browser: RestaurantBrowser,
};
