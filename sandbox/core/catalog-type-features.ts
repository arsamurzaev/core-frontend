import { getCatalogTypeCode } from "@/shared/lib/catalog-type";
import type { CatalogLike } from "@/shared/lib/utils";
import type { CategoryCardVariant } from "@/core/modules/category/ui/category-card";

const RESTAURANT_CATALOG_TYPE_CODES = new Set(["cafe", "restaurant"]);
const CATALOG_TYPES_WITHOUT_BRANDS = RESTAURANT_CATALOG_TYPE_CODES;

export interface SandboxCatalogPresentation {
  catalogTabLabel: string;
  categoryAdminCreateDescription: string;
  categoryAdminEditDescription: string;
  categoryCardVariant: CategoryCardVariant;
  copySuccessMessage: string;
  shareButtonLabel: string;
  supportsCategoryDetails: boolean;
}

const DEFAULT_CATALOG_PRESENTATION: SandboxCatalogPresentation = {
  catalogTabLabel: "Каталог",
  categoryAdminCreateDescription:
    "Создайте новую категорию, чтобы она сразу появилась в каталоге и в карточках выбора.",
  categoryAdminEditDescription:
    "Измените название, описание или изображение категории. Обновление сразу попадет в каталог.",
  categoryCardVariant: "default",
  copySuccessMessage: "Ссылка скопирована в буфер обмена",
  shareButtonLabel: "Поделиться каталогом",
  supportsCategoryDetails: true,
};

const RESTAURANT_CATALOG_PRESENTATION: SandboxCatalogPresentation = {
  catalogTabLabel: "Меню",
  categoryAdminCreateDescription:
    "Создайте новую категорию, чтобы она сразу появилась в меню и в карточках выбора.",
  categoryAdminEditDescription:
    "Измените название категории. Обновление сразу попадет в меню.",
  categoryCardVariant: "compact",
  copySuccessMessage: "Ссылка на меню скопирована",
  shareButtonLabel: "Поделиться меню",
  supportsCategoryDetails: false,
};

export function isRestaurantCatalog(catalog?: CatalogLike | null): boolean {
  return RESTAURANT_CATALOG_TYPE_CODES.has(getCatalogTypeCode(catalog));
}

export function supportsCatalogBrands(catalog?: CatalogLike | null): boolean {
  return !CATALOG_TYPES_WITHOUT_BRANDS.has(getCatalogTypeCode(catalog));
}

export function getSandboxCatalogPresentation(
  catalog?: CatalogLike | null,
): SandboxCatalogPresentation {
  return isRestaurantCatalog(catalog)
    ? RESTAURANT_CATALOG_PRESENTATION
    : DEFAULT_CATALOG_PRESENTATION;
}
