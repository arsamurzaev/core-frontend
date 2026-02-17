export type CatalogKind = "default" | "restaurant" | "clothing";

export interface ProductCardUiSchema {
  id: string;
  kind: CatalogKind;
  subtitleAttributeKey?: string;
  metaAttributeKey?: string;
  ctaText: string;
  defaultChip: string;
  surfaceClassName: string;
}

export interface ProductCardPresentation {
  title: string;
  subtitle: string;
  description?: string;
  metaLabel?: string;
  metaValue?: string;
  chips: string[];
  ctaText: string;
  surfaceClassName?: string;
}
