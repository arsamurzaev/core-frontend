import dynamic from "next/dynamic";
import type { CatalogExtension } from "@/core/catalog-runtime/runtime-contracts";
import type { CartCardActionSlotProps } from "@/core/catalog-runtime/slot-contracts";
import {
  WHOLESALE_PRICING,
  WHOLESALE_TYPE_CODES,
} from "./wholesale.metadata";

const WholesaleCartCardAction = dynamic<CartCardActionSlotProps>(
  () =>
    import("./ui/wholesale-cart-card-action").then(
      (module) => module.WholesaleCartCardAction,
    ),
  { ssr: false },
);

export const wholesaleExtension: CatalogExtension = {
  typeCode: WHOLESALE_TYPE_CODES,
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
  pricing: WHOLESALE_PRICING,
  slots: {
    CartCardAction: WholesaleCartCardAction,
  },
};
