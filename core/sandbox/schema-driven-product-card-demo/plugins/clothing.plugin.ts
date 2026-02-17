import { OUTERWEAR_SIZE_KEY } from "../model/constants";
import { findTypeAttributeByKey, getProductAttributeText } from "../lib/attribute-utils";
import type { ProductCardPlugin } from "./contracts";

export const clothingProductCardPlugin: ProductCardPlugin = {
  id: "plugin.product-card.clothing",
  kind: "clothing",
  matches: (catalogType) => Boolean(findTypeAttributeByKey(catalogType, OUTERWEAR_SIZE_KEY)),
  present: ({ product, schema, catalogType }) => {
    const sizeAttribute = findTypeAttributeByKey(catalogType, OUTERWEAR_SIZE_KEY) ?? null;
    const sizeLabel = sizeAttribute?.displayName ?? "Размер";
    const sizeValue = getProductAttributeText(product, OUTERWEAR_SIZE_KEY, "Не указан");
    const variantChip = sizeAttribute?.isVariantAttribute ? "Variant" : "Static";

    return {
      title: product.name,
      subtitle: `${sizeLabel}: ${sizeValue}`,
      description: "Карточка одежды с вариативным размерным рядом.",
      metaLabel: "Размерный ряд",
      metaValue: sizeValue,
      chips: [schema.defaultChip, variantChip],
      ctaText: schema.ctaText,
      surfaceClassName: schema.surfaceClassName,
    };
  },
};
