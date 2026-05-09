import type { CatalogCurrentDto } from "@/shared/api/generated/react-query";
import {
  getCatalogCheckoutConfig,
  resolveCheckoutAvailableMethods,
  type CheckoutConfig,
  type CheckoutMethod,
} from "@/shared/lib/checkout-methods";
import { getCatalogTypeCode } from "@/shared/lib/catalog-type";

const CATALOG_TYPES_WITH_PREORDER = new Set(["restaurant", "cafe"]);

export function resolveSandboxCheckoutAvailableMethods(
  catalog: Pick<CatalogCurrentDto, "type">,
): CheckoutMethod[] {
  const baseMethods = resolveCheckoutAvailableMethods();

  if (CATALOG_TYPES_WITH_PREORDER.has(getCatalogTypeCode(catalog))) {
    return [...baseMethods, "PREORDER"];
  }

  return baseMethods;
}

export function getSandboxCatalogCheckoutConfig(
  catalog: Pick<CatalogCurrentDto, "contacts" | "settings" | "type">,
): CheckoutConfig {
  return getCatalogCheckoutConfig(catalog, {
    availableMethods: resolveSandboxCheckoutAvailableMethods(catalog),
  });
}
