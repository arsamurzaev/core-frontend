import type { CatalogCurrentDto } from "@/shared/api/generated/react-query";
import {
  getCatalogCheckoutConfig,
  type CheckoutConfig,
  type CheckoutMethod,
} from "@/shared/lib/checkout-methods";
import { getCatalogTypeCode } from "@/shared/lib/catalog-type";

export function resolveSandboxCheckoutAvailableMethods(
  catalog: Pick<CatalogCurrentDto, "type">,
): CheckoutMethod[] {
  const code = getCatalogTypeCode(catalog)?.trim().toLowerCase();

  if (code === "restaurant" || code === "cafe") {
    return ["DELIVERY", "PICKUP", "PREORDER"];
  }

  if (code === "clothing" || code === "clothes") {
    return ["PICKUP"];
  }

  return ["DELIVERY"];
}

export function getSandboxCatalogCheckoutConfig(
  catalog: Pick<CatalogCurrentDto, "contacts" | "settings" | "type">,
): CheckoutConfig {
  return getCatalogCheckoutConfig(catalog, {
    availableMethods: resolveSandboxCheckoutAvailableMethods(catalog),
  });
}
