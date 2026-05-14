"use client";

import {
  normalizeCreateProductFormValues,
  type CreateProductFormValues,
} from "@/core/modules/product/editor/model/form-config";
import { isMissingRequiredValue } from "@/core/modules/product/editor/model/product-attributes";
import {
  hasEnabledVariantCombinations,
  validateSaleUnitsForSubmit,
} from "@/core/modules/product/editor/model/product-variants";
import {
  type AttributeDto,
  AttributeDtoDataType,
} from "@/shared/api/generated/react-query";

interface ValidateProductFormValuesParams {
  invalidFormMessage: string;
  invalidPriceMessage: string;
  canUseCatalogSaleUnits?: boolean;
  values: CreateProductFormValues;
  variantAttributes?: AttributeDto[];
  visibleAttributes: AttributeDto[];
}

type ValidateProductFormValuesResult =
  | {
      success: true;
      errorMessage: null;
      normalizedPrice: number | null;
      parsedValues: CreateProductFormValues;
    }
  | {
      success: false;
      errorMessage: string;
      normalizedPrice?: never;
      parsedValues?: never;
    };

export function validateProductFormValues({
  invalidFormMessage,
  invalidPriceMessage,
  canUseCatalogSaleUnits = false,
  values,
  variantAttributes = [],
  visibleAttributes,
}: ValidateProductFormValuesParams): ValidateProductFormValuesResult {
  const parsedValues = normalizeCreateProductFormValues(values);

  if (parsedValues.name.trim().length === 0) {
    return {
      success: false,
      errorMessage: invalidFormMessage,
    };
  }

  const normalizedPrice =
    parsedValues.price.trim().length > 0 ? Number(parsedValues.price) : null;
  if (
    normalizedPrice !== null &&
    (!Number.isFinite(normalizedPrice) || normalizedPrice < 0)
  ) {
    return {
      success: false,
      errorMessage: invalidPriceMessage,
    };
  }

  if (
    parsedValues.productTypeId &&
    variantAttributes.length > 0 &&
    !hasEnabledVariantCombinations(parsedValues.variants, variantAttributes)
  ) {
    return {
      success: false,
      errorMessage:
        "Выберите хотя бы одну включенную комбинацию вариантов товара.",
    };
  }

  for (const attribute of visibleAttributes) {
    const value = parsedValues.attributes[attribute.id];

    if (isMissingRequiredValue(attribute, value)) {
      return {
        success: false,
        errorMessage: `Заполните обязательный атрибут "${attribute.displayName}".`,
      };
    }

    if (
      (attribute.dataType === AttributeDtoDataType.INTEGER ||
        attribute.dataType === AttributeDtoDataType.DECIMAL) &&
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !Number.isFinite(Number(value))
    ) {
      return {
        success: false,
        errorMessage: `Атрибут "${attribute.displayName}" должен быть числом.`,
      };
    }
  }

  if (canUseCatalogSaleUnits) {
    const saleUnitsIssue = validateSaleUnitsForSubmit(
      parsedValues,
      variantAttributes,
    );
    if (saleUnitsIssue) {
      return {
        success: false,
        errorMessage: saleUnitsIssue.message,
      };
    }
  }

  return {
    success: true,
    errorMessage: null,
    normalizedPrice,
    parsedValues,
  };
}
