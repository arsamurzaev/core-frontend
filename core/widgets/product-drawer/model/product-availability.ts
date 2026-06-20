import type { ProductWithDetailsDto } from "@/shared/api/generated/react-query";
import { ProductWithDetailsDtoStatus } from "@/shared/api/generated/react-query";
import { isChildCatalog } from "@/shared/lib/catalog-content-access";
import { isCatalogManagerRole } from "@/shared/lib/catalog-role";

export interface ProductUnavailableState {
  description: string;
  title: string;
}

type CatalogAvailabilityRef = {
  parentId?: string | null;
};

export const PRODUCT_UNAVAILABLE_STATE: ProductUnavailableState = {
  description: "Эта позиция скрыта из каталога или ссылка больше не актуальна.",
  title: "Товар временно недоступен",
};

export const PRODUCT_HIDDEN_BY_PARENT_CATALOG_STATE: ProductUnavailableState = {
  description:
    "Эта позиция недоступна в дочернем каталоге, потому что скрыта в родительском каталоге.",
  title: "Товар скрыт родительским каталогом",
};

export function isProductPubliclyAvailable(
  product: ProductWithDetailsDto | null | undefined,
): boolean {
  return !product || product.status === ProductWithDetailsDtoStatus.ACTIVE;
}

export function shouldHideProductFromCustomer(params: {
  product: ProductWithDetailsDto | null | undefined;
  userRole?: string | null;
}): boolean {
  if (!params.product || isCatalogManagerRole(params.userRole)) {
    return false;
  }

  return !isProductPubliclyAvailable(params.product);
}

export function getProductUnavailableState(params: {
  catalog?: CatalogAvailabilityRef | null;
  product: ProductWithDetailsDto | null | undefined;
  userRole?: string | null;
}): ProductUnavailableState | null {
  if (
    params.product &&
    isChildCatalog(params.catalog) &&
    !isProductPubliclyAvailable(params.product)
  ) {
    return PRODUCT_HIDDEN_BY_PARENT_CATALOG_STATE;
  }

  if (!shouldHideProductFromCustomer(params)) {
    return null;
  }

  return PRODUCT_UNAVAILABLE_STATE;
}
