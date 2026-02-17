import { CAFE_BEAN_ORIGIN_KEY } from "../model/constants";
import { findTypeAttributeByKey, getProductAttributeText } from "../lib/attribute-utils";
import type { ProductCardPlugin } from "./contracts";

export const restaurantProductCardPlugin: ProductCardPlugin = {
  id: "plugin.product-card.restaurant",
  kind: "restaurant",
  matches: (catalogType) => Boolean(findTypeAttributeByKey(catalogType, CAFE_BEAN_ORIGIN_KEY)),
  present: ({ product, schema, catalogType }) => {
    const beanAttribute =
      findTypeAttributeByKey(catalogType, CAFE_BEAN_ORIGIN_KEY) ?? null;
    const beanLabel = beanAttribute?.displayName ?? "Размер зерна";
    const beanValue = getProductAttributeText(
      product,
      CAFE_BEAN_ORIGIN_KEY,
      "Не указан",
    );

    return {
      title: product.name,
      subtitle: `${beanLabel}: ${beanValue}`,
      description: "Карточка ресторана с фокусом на характеристику зерна.",
      metaLabel: beanLabel,
      metaValue: beanValue,
      chips: [schema.defaultChip, "Food"],
      ctaText: schema.ctaText,
      surfaceClassName: schema.surfaceClassName,
    };
  },
};
