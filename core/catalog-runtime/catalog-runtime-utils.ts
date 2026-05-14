import type { CatalogCurrentDto } from "@/shared/api/generated/react-query";
import type { CatalogLike } from "@/shared/lib/utils";
import type {
  CheckoutConfig,
  CheckoutMethod,
} from "@/shared/lib/checkout-methods";
import type { ResolvedProductCardPlugin } from "@/core/modules/product/plugins/contracts";
import { getCatalogRuntimeCheckoutConfig } from "./checkout";
import type { CatalogPresentationConfig } from "./contracts";
import { resolveCatalogRuntime } from "./resolve-catalog-runtime";

export function getCatalogRuntimeCommentPlaceholder(
  catalog?: CatalogLike | null,
): string {
  return resolveCatalogRuntime(catalog).checkout.commentPlaceholder;
}

export function getCatalogRuntimePresentation(
  catalog?: CatalogLike | null,
): CatalogPresentationConfig {
  return resolveCatalogRuntime(catalog).presentation;
}

export function catalogRuntimeSupportsBrands(
  catalog?: CatalogLike | null,
): boolean {
  return getCatalogRuntimePresentation(catalog).supportsBrands;
}

export function isCatalogRuntimeType(
  catalog: CatalogLike | null | undefined,
  typeCodes: string | string[],
): boolean {
  const runtimeTypeCode = resolveCatalogRuntime(catalog).typeCode;
  const allowedTypeCodes = Array.isArray(typeCodes) ? typeCodes : [typeCodes];

  return allowedTypeCodes
    .map((typeCode) => typeCode.trim().toLowerCase())
    .includes(runtimeTypeCode);
}

export function isRestaurantCatalog(catalog?: CatalogLike | null): boolean {
  return isCatalogRuntimeType(catalog, ["cafe", "restaurant"]);
}

export function resolveCatalogRuntimeProductCard(
  typeCode: string | null | undefined,
): ResolvedProductCardPlugin {
  return resolveCatalogRuntime(
    typeCode
      ? {
          type: {
            code: typeCode,
          },
        }
      : null,
  ).productCard;
}

export function resolveCatalogRuntimeCheckoutAvailableMethods(
  catalog: Pick<CatalogCurrentDto, "type">,
): CheckoutMethod[] {
  return resolveCatalogRuntime(catalog).checkout.availableMethods;
}

export function getCatalogRuntimeCheckoutConfigForCatalog(
  catalog: Pick<CatalogCurrentDto, "contacts" | "settings" | "type">,
): CheckoutConfig {
  return getCatalogRuntimeCheckoutConfig(catalog, resolveCatalogRuntime(catalog));
}
