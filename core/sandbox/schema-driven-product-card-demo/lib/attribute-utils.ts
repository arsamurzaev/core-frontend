import type {
  AttributeDto,
  CatalogTypeDto,
  ProductWithAttributesDto,
} from "@/shared/api/generated";
import type { ParsedAttributeValue } from "@/shared/lib/attributes";
import { getAttributeValueByKey } from "@/shared/lib/attributes";
import { CAFE_BEAN_ORIGIN_KEY, OUTERWEAR_SIZE_KEY } from "../model/constants";
import type { CatalogKind } from "../model/types";

export function findTypeAttributeByKey(
  catalogType: CatalogTypeDto,
  key: string,
): AttributeDto | undefined {
  return catalogType.attributes.find((attribute) => attribute.key === key);
}

export function hasTypeAttribute(
  catalogType: CatalogTypeDto,
  key: string,
): boolean {
  return Boolean(findTypeAttributeByKey(catalogType, key));
}

export function detectCatalogKind(catalogType: CatalogTypeDto): CatalogKind {
  const code = catalogType.code.toLowerCase();

  if (hasTypeAttribute(catalogType, CAFE_BEAN_ORIGIN_KEY)) {
    return "restaurant";
  }

  if (hasTypeAttribute(catalogType, OUTERWEAR_SIZE_KEY)) {
    return "clothing";
  }

  if (code.includes("rest") || code.includes("food")) {
    return "restaurant";
  }

  if (code.includes("cloth") || code.includes("wear") || code.includes("fashion")) {
    return "clothing";
  }

  return "default";
}

function attributeValueToText(value: ParsedAttributeValue): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }

  if (typeof value === "boolean") {
    return value ? "Да" : "Нет";
  }

  return "";
}

export function getProductAttributeText(
  product: ProductWithAttributesDto,
  key: string,
  fallback: string,
): string {
  const raw = getAttributeValueByKey(product.productAttributes, key, null);
  const text = attributeValueToText(raw);
  return text || fallback;
}
