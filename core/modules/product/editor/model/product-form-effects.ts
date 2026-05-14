import {
  AttributeDtoDataType,
  type AttributeDto,
} from "@/shared/api/generated/react-query";
import type { CreateProductFormValues } from "./form-config";
import { getDiscountedPriceAttributeId } from "./product-discount";

type ProductAttributeValues = CreateProductFormValues["attributes"];

export interface ProductFormAttributeValuesResult {
  changed: boolean;
  values: ProductAttributeValues;
}

function cloneAttributeValues(
  values: ProductAttributeValues,
): ProductAttributeValues {
  return { ...values };
}

export function applyBooleanAttributeDefaults(
  attributes: AttributeDto[],
  currentValues: ProductAttributeValues,
): ProductFormAttributeValuesResult {
  let nextValues: ProductAttributeValues | null = null;

  for (const attribute of attributes) {
    if (
      attribute.dataType === AttributeDtoDataType.BOOLEAN &&
      currentValues[attribute.id] === undefined
    ) {
      nextValues ??= cloneAttributeValues(currentValues);
      nextValues[attribute.id] = false;
    }
  }

  return {
    changed: nextValues !== null,
    values: nextValues ?? currentValues,
  };
}

export function clearAttributeValues(
  attributeIds: string[],
  currentValues: ProductAttributeValues,
): ProductFormAttributeValuesResult {
  let nextValues: ProductAttributeValues | null = null;

  for (const attributeId of attributeIds) {
    if (currentValues[attributeId] !== null) {
      nextValues ??= cloneAttributeValues(currentValues);
      nextValues[attributeId] = null;
    }
  }

  return {
    changed: nextValues !== null,
    values: nextValues ?? currentValues,
  };
}

export function getDiscountedPriceAttributeIdToReset(
  attributes: AttributeDto[],
  currentValues: ProductAttributeValues,
): string | null {
  const discountedPriceAttributeId =
    getDiscountedPriceAttributeId(attributes);

  if (!discountedPriceAttributeId) {
    return null;
  }

  return currentValues[discountedPriceAttributeId] === null
    ? null
    : discountedPriceAttributeId;
}
