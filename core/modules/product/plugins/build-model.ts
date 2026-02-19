import type {
  CatalogCurrentDto,
  ProductWithAttributesDto,
  ProductWithDetailsDto,
} from "@/shared/api/generated";
import { getAttributeValueByKey, type ParsedAttributeValue } from "@/shared/lib/attributes";
import type {
  ProductCardPluginModel,
  ResolvedProductCardPlugin,
} from "./contracts";

type ProductCardEntity = ProductWithAttributesDto | ProductWithDetailsDto;

function isProductWithDetails(
  product: ProductCardEntity,
): product is ProductWithDetailsDto {
  return "variants" in product;
}

function toTextValue(value: ParsedAttributeValue): string | null {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }

  if (typeof value === "boolean") {
    return value ? "Да" : "Нет";
  }

  return null;
}

function getCatalogAttributeLabel(
  catalog: CatalogCurrentDto | null | undefined,
  key: string,
  fallback: string,
): string {
  const label = catalog?.type.attributes.find((attribute) => attribute.key === key)
    ?.displayName;
  return label ?? fallback;
}

function getVariantValuesByKey(product: ProductCardEntity, key: string): string[] {
  if (!isProductWithDetails(product)) {
    return [];
  }

  const values = new Set<string>();

  for (const variant of product.variants ?? []) {
    for (const attribute of variant.attributes ?? []) {
      if (attribute.attribute?.key !== key) {
        continue;
      }

      const value = attribute.enumValue?.displayName ?? attribute.enumValue?.value;
      if (value) {
        values.add(value);
      }
    }
  }

  return Array.from(values);
}

function getAllVariantsSummary(product: ProductCardEntity): string | null {
  if (!isProductWithDetails(product)) {
    return null;
  }

  const variants = new Set<string>();

  for (const variant of product.variants ?? []) {
    const value = (variant.attributes ?? [])
      .map(
        (attribute) =>
          attribute.enumValue?.displayName ?? attribute.enumValue?.value ?? null,
      )
      .filter((item): item is string => Boolean(item))
      .join(" / ");

    if (value) {
      variants.add(value);
    }
  }

  if (variants.size === 0) {
    return null;
  }

  return Array.from(variants).join(", ");
}

function resolveAttributeValue(product: ProductCardEntity, key: string): string | null {
  const fromAttributes = toTextValue(
    getAttributeValueByKey(product.productAttributes, key, null),
  );

  if (fromAttributes) {
    return fromAttributes;
  }

  const variantValues = getVariantValuesByKey(product, key);
  if (variantValues.length === 0) {
    return null;
  }

  return variantValues.join(", ");
}

export function buildProductCardPluginModel(
  product: ProductCardEntity,
  catalog: CatalogCurrentDto | null | undefined,
  plugin: ResolvedProductCardPlugin,
): ProductCardPluginModel {
  const lines = plugin.attributes.map((attribute) => {
    const label = getCatalogAttributeLabel(
      catalog,
      attribute.key,
      attribute.fallbackLabel,
    );
    const value =
      resolveAttributeValue(product, attribute.key) ??
      attribute.fallbackValue ??
      "Не указан";

    return {
      id: attribute.key,
      label,
      value,
    };
  });

  if (plugin.showVariants) {
    const variants = getAllVariantsSummary(product);
    if (variants && !lines.some((line) => line.value === variants)) {
      lines.push({
        id: "variants",
        label: "Вариации",
        value: variants,
      });
    }
  }

  return {
    badges: plugin.badges,
    lines,
  };
}
