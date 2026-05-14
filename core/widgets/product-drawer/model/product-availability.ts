import type { ProductWithDetailsDto } from "@/shared/api/generated/react-query";
import { ProductWithDetailsDtoStatus } from "@/shared/api/generated/react-query";
import { isCatalogManagerRole } from "@/shared/lib/catalog-role";

export interface ProductUnavailableState {
  description: string;
  title: string;
}

export const PRODUCT_UNAVAILABLE_STATE: ProductUnavailableState = {
  description: "Эта позиция скрыта из каталога или ссылка больше не актуальна.",
  title: "Товар временно недоступен",
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
