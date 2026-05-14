import {
  buildInitialAttributeValues,
  hasPersistedAttributeValue,
} from "@/core/modules/product/editor/model/product-attributes";
import { type AttributeFormValue } from "@/core/modules/product/editor/model/types";
import {
  type AttributeDto,
  ProductAttributeRefDtoDataType,
  type ProductAttributeDto,
  type ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";

const DISCOUNT_ATTRIBUTE_KEYS = new Set([
  "discount",
  "discountedprice",
  "discountstartat",
  "discountendat",
]);

function normalizeAttributeKey(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export function isDiscountAttributeKey(value: string | null | undefined): boolean {
  return DISCOUNT_ATTRIBUTE_KEYS.has(normalizeAttributeKey(value));
}

export function toProductFormAttributeValue(
  attribute: ProductAttributeDto,
): AttributeFormValue | undefined {
  switch (attribute.attribute.dataType) {
    case ProductAttributeRefDtoDataType.ENUM:
      return attribute.enumValueId ?? null;
    case ProductAttributeRefDtoDataType.INTEGER:
      return attribute.valueInteger === null || attribute.valueInteger === undefined
        ? null
        : String(attribute.valueInteger);
    case ProductAttributeRefDtoDataType.DECIMAL:
      return attribute.valueDecimal === null || attribute.valueDecimal === undefined
        ? null
        : String(attribute.valueDecimal);
    case ProductAttributeRefDtoDataType.BOOLEAN:
      return typeof attribute.valueBoolean === "boolean"
        ? attribute.valueBoolean
        : false;
    case ProductAttributeRefDtoDataType.DATETIME:
      return attribute.valueDateTime ?? null;
    case ProductAttributeRefDtoDataType.STRING:
    default:
      return attribute.valueString ?? null;
  }
}

export function buildEditProductAttributeFormState(
  product: ProductWithDetailsDto,
  productAttributes: AttributeDto[],
): {
  attributes: Record<string, AttributeFormValue>;
  hasDiscount: boolean;
} {
  const attributes = buildInitialAttributeValues(productAttributes);
  let hasDiscount = false;

  for (const attribute of product.productAttributes ?? []) {
    const nextValue = toProductFormAttributeValue(attribute);
    attributes[attribute.attributeId] = nextValue ?? null;

    if (
      isDiscountAttributeKey(attribute.attribute.key) &&
      hasPersistedAttributeValue(nextValue)
    ) {
      hasDiscount = true;
    }
  }

  return {
    attributes,
    hasDiscount,
  };
}

export function buildPersistedEditableAttributeValues(
  product: ProductWithDetailsDto,
  productAttributes: AttributeDto[],
): Record<string, AttributeFormValue> {
  const editableAttributeIds = new Set(
    productAttributes.map((attribute) => attribute.id),
  );
  const values: Record<string, AttributeFormValue> = {};

  for (const attribute of product.productAttributes ?? []) {
    if (!editableAttributeIds.has(attribute.attributeId)) {
      continue;
    }

    values[attribute.attributeId] =
      toProductFormAttributeValue(attribute) ?? null;
  }

  return values;
}
