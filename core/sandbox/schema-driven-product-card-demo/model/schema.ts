import { CAFE_BEAN_ORIGIN_KEY, OUTERWEAR_SIZE_KEY } from "./constants";
import type { CatalogKind, ProductCardUiSchema } from "./types";

export const PRODUCT_CARD_SCHEMAS: Record<CatalogKind, ProductCardUiSchema> = {
  default: {
    id: "card.default.v1",
    kind: "default",
    ctaText: "Открыть",
    defaultChip: "Базовый",
    surfaceClassName: "border-slate-200",
  },
  restaurant: {
    id: "card.restaurant.v1",
    kind: "restaurant",
    subtitleAttributeKey: CAFE_BEAN_ORIGIN_KEY,
    metaAttributeKey: CAFE_BEAN_ORIGIN_KEY,
    ctaText: "К заказу",
    defaultChip: "Restaurant",
    surfaceClassName: "border-amber-200",
  },
  clothing: {
    id: "card.clothing.v1",
    kind: "clothing",
    subtitleAttributeKey: OUTERWEAR_SIZE_KEY,
    metaAttributeKey: OUTERWEAR_SIZE_KEY,
    ctaText: "Выбрать размер",
    defaultChip: "Clothing",
    surfaceClassName: "border-cyan-200",
  },
};
