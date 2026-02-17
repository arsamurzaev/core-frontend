import type { ProductCardPlugin } from "./contracts";

export const defaultProductCardPlugin: ProductCardPlugin = {
  id: "plugin.product-card.default",
  kind: "default",
  matches: () => true,
  present: ({ product, schema }) => ({
    title: product.name,
    subtitle: "Универсальная карточка",
    description: `SKU: ${product.sku}`,
    chips: [schema.defaultChip],
    ctaText: schema.ctaText,
    surfaceClassName: schema.surfaceClassName,
  }),
};
