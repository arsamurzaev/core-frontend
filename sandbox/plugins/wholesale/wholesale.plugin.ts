import type { CatalogPlugin } from "../../core/contracts";
import { WholesaleCartCardAction } from "./ui/wholesale-cart-card-action";

export const wholesalePlugin: CatalogPlugin = {
  typeCode: "wholesale",
  CartCardAction: WholesaleCartCardAction,
};
