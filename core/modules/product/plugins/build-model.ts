import type {
  CatalogCurrentDto,
  ProductWithAttributesDto,
  ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import {
  pickAttributeValues,
  type ParsedAttributeValue,
} from "@/shared/lib/attributes";
import type {
  ProductCardPluginModel,
  ResolvedProductCardPlugin,
} from "./contracts";
import { formatProductVariantLabel } from "../model/product-variant-label";
import { isVisibleForActivePriceList } from "../model/product-price-list-visibility";
import {
  sortProductVariantAttributes,
  sortProductVariants,
} from "../model/product-variant-ordering";

type ProductCardEntity = ProductWithAttributesDto | ProductWithDetailsDto;

function isProductWithDetails(
  product: ProductCardEntity,
): product is ProductWithDetailsDto {
  return "variants" in product;
}

function canShowProductVariants(
  product: ProductCardEntity,
): product is ProductWithDetailsDto {
  return isProductWithDetails(product);
}

function hasVariantPickerOptions(product: ProductCardEntity): boolean {
  return (product.variantPickerOptions?.length ?? 0) > 0;
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
  const label = catalog?.type.attributes.find(
    (attribute) => attribute.key === key,
  )?.displayName;
  return label ?? fallback;
}

function getVariantValuesByKey(
  product: ProductCardEntity,
  key: string,
): string[] {
  if (!canShowProductVariants(product)) {
    return [];
  }

  const values = new Set<string>();

  for (const variant of sortProductVariants(product.variants)) {
    for (const attribute of sortProductVariantAttributes(variant.attributes)) {
      if (attribute.attribute?.key !== key) {
        continue;
      }

      const value =
        attribute.enumValue?.displayName ?? attribute.enumValue?.value;
      if (value) {
        values.add(value);
      }
    }
  }

  return Array.from(values);
}

function getPickerOptionVariantsSummary(
  product: ProductCardEntity,
): string | null {
  if (!hasVariantPickerOptions(product)) {
    return null;
  }

  const variants = new Set(
    (product.variantPickerOptions ?? [])
      .filter(
        (option) =>
          isVisibleForActivePriceList(product, option) &&
          option.status !== "DISABLED",
      )
      .map((option) => option.label?.trim())
      .filter((label): label is string => Boolean(label)),
  );

  return variants.size > 0 ? Array.from(variants).join(", ") : null;
}

function getAllVariantsSummary(product: ProductCardEntity): string | null {
  const variants = new Set<string>();

  if (canShowProductVariants(product)) {
    for (const variant of sortProductVariants(product.variants)) {
      if (!isVisibleForActivePriceList(product, variant)) {
        continue;
      }

      const value = formatProductVariantLabel(variant);

      if (value) {
        variants.add(value);
      }
    }
  }

  if (variants.size > 0) {
    return Array.from(variants).join(", ");
  }

  return getPickerOptionVariantsSummary(product);
}

function resolveAttributeValue(
  product: ProductCardEntity,
  key: string,
  valueFromAttributes: ParsedAttributeValue,
): string | null {
  const fromAttributes = toTextValue(valueFromAttributes);

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
  const attributeValuesByKey = pickAttributeValues(
    product.productAttributes,
    plugin.attributes.map((attribute) => attribute.key),
    null,
  );

  const lines = plugin.attributes.map((attribute) => {
    const label = getCatalogAttributeLabel(
      catalog,
      attribute.key,
      attribute.fallbackLabel,
    );
    const value =
      resolveAttributeValue(
        product,
        attribute.key,
        attributeValuesByKey[attribute.key] ?? null,
      ) ??
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
    if (variants) {
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
