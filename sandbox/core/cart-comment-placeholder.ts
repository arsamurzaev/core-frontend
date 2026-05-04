import { getCatalogTypeCode } from "@/shared/lib/catalog-type";
import type { CatalogLike } from "@/shared/lib/utils";

const DEFAULT_CART_COMMENT_PLACEHOLDER =
  "Укажите пожелания к заказу: характеристики, замену, упаковку, доставку или другие важные детали.";

const CART_COMMENT_PLACEHOLDERS_BY_CATALOG_TYPE: Record<string, string> = {
  beauty:
    "Укажите оттенок, тип кожи или волос и пожелания. Например: тон 02, кожа чувствительная, шампунь без сильной отдушки.",
  clothes:
    "Укажите размеры, цвет и пожелания по посадке. Например: футболка S, джинсы 28, черный цвет, нужна свободная посадка.",
  food:
    "Укажите пожелания по продуктам, замене или доставке. Например: спелые авокадо, без кинзы, если нет моцареллы - заменить на буррату.",
  gifts:
    "Укажите повод, кому подарок и пожелания к упаковке. Например: подарок маме на день рождения, нежная упаковка, открытка с текстом.",
  home:
    "Укажите желаемые характеристики для дома. Например: серый плед, хлопок, размер 200x220, без яркого принта.",
  restaurant:
    "Укажите пожелания к блюдам, приборам и времени. Например: без лука, соус отдельно, приборы на 2 персоны, доставка к 19:00.",
  tech:
    "Укажите модель, совместимость, цвет или комплектацию. Например: чехол для iPhone 15, черный, нужна быстрая зарядка USB-C.",
  wholesale:
    "Укажите объем, фасовку, реквизиты или условия поставки. Например: 10 коробок, по 12 шт., нужна счет-фактура и доставка до склада.",
};

export function getCartCommentPlaceholder(
  catalog?: CatalogLike | null,
): string {
  const catalogTypeCode = getCatalogTypeCode(catalog);

  return (
    CART_COMMENT_PLACEHOLDERS_BY_CATALOG_TYPE[catalogTypeCode] ??
    DEFAULT_CART_COMMENT_PLACEHOLDER
  );
}
