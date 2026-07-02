import dynamic from "next/dynamic";
import type { CatalogExtension } from "@/core/catalog-runtime/runtime-contracts";
import type { CartCardActionSlotProps } from "@/core/catalog-runtime/slot-contracts";

const WholesaleCartCardAction = dynamic<CartCardActionSlotProps>(
  () =>
    import("./ui/wholesale-cart-card-action").then(
      (module) => module.WholesaleCartCardAction,
    ),
  { ssr: false },
);

export const wholesaleExtension: CatalogExtension = {
  typeCode: ["wholesale", "whosale"],
  manifest: {
    id: "wholesale",
    label: "Wholesale storefront",
    analyticsEvents: ["manager.orderStart"],
  },
  theme: {
    presetId: "wholesale",
  },
  cart: {
    supportsManagerOrder: true,
  },
  slots: {
    CartCardAction: WholesaleCartCardAction,
  },
};
