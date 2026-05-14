import dynamic from "next/dynamic";
import type {
  CartCardActionSlotProps,
  CatalogExtension,
} from "@/core/catalog-runtime/contracts";

const WholesaleCartCardAction = dynamic<CartCardActionSlotProps>(
  () =>
    import("./ui/wholesale-cart-card-action").then(
      (module) => module.WholesaleCartCardAction,
    ),
  { ssr: false },
);

export const wholesaleExtension: CatalogExtension = {
  typeCode: ["wholesale", "whosale"],
  cart: {
    supportsManagerOrder: true,
  },
  slots: {
    CartCardAction: WholesaleCartCardAction,
  },
};
