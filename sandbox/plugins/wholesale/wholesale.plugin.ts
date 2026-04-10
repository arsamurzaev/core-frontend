import type { CatalogPlugin } from "../../core/contracts";
import { WholesaleCartCardAction } from "./ui/wholesale-cart-card-action";

export const wholesalePlugin: CatalogPlugin = {
  typeCode: "wholesale",
  filterAccess: "all",
  showTabToggle: true,
  CartCardAction: WholesaleCartCardAction,
};
