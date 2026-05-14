import type { CatalogCurrentDto } from "@/shared/api/generated/react-query";
import {
  getCatalogCheckoutConfig,
  type CheckoutConfig,
} from "@/shared/lib/checkout-methods";
import type { CatalogRuntime } from "./contracts";

export type CatalogCheckoutSource = Pick<
  CatalogCurrentDto,
  "contacts" | "settings" | "type"
>;

export function getCatalogRuntimeCheckoutConfig(
  catalog: CatalogCheckoutSource,
  runtime: Pick<CatalogRuntime, "checkout">,
): CheckoutConfig {
  return getCatalogCheckoutConfig(catalog, {
    availableMethods: runtime.checkout.availableMethods,
    defaultEnabledMethods: runtime.checkout.defaultEnabledMethods,
  });
}
