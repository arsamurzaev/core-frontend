import type { CatalogCurrentDto } from "@/shared/api/generated/react-query";
import {
  getCatalogCheckoutConfig,
  resolveCheckoutAvailableMethods,
  type CheckoutConfig,
  type CheckoutMethod,
} from "@/shared/lib/checkout-methods";
import { getCatalogTypeCode } from "@/shared/lib/catalog-type";

export function resolveSandboxCheckoutAvailableMethods(
  catalog: Pick<CatalogCurrentDto, "type">,
): CheckoutMethod[] {
  return resolveCheckoutAvailableMethods(getCatalogTypeCode(catalog));
}

export function getSandboxCatalogCheckoutConfig(
  catalog: Pick<CatalogCurrentDto, "contacts" | "settings" | "type">,
): CheckoutConfig {
  return getCatalogCheckoutConfig(catalog, {
    availableMethods: resolveSandboxCheckoutAvailableMethods(catalog),
  });
}
