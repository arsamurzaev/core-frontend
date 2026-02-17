import type { CatalogTypeDto, ProductWithAttributesDto } from "@/shared/api/generated";
import type {
  CatalogKind,
  ProductCardPresentation,
  ProductCardUiSchema,
} from "../model/types";

export interface ProductCardPluginContext {
  product: ProductWithAttributesDto;
  catalogType: CatalogTypeDto;
  schema: ProductCardUiSchema;
}

export interface ProductCardPlugin {
  id: string;
  kind: CatalogKind;
  matches: (catalogType: CatalogTypeDto) => boolean;
  present: (context: ProductCardPluginContext) => ProductCardPresentation;
}
