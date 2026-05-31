"use client";

import {
  normalizeCreateProductFormValues,
  type CreateProductFormValues,
} from "@/core/modules/product/editor/model/form-config";
import { isMissingRequiredValue } from "@/core/modules/product/editor/model/product-attributes";
import {
  buildVariantMatrixRows,
  hasEnabledVariantCombinations,
  validateSaleUnitsForSubmit,
} from "@/core/modules/product/editor/model/product-variants";
import {
  type AttributeDto,
  AttributeDtoDataType,
} from "@/shared/api/generated/react-query";
import {
  isCatalogPriceValueCompatible,
  type CatalogPriceFormatMode,
} from "@/shared/lib/price-format";

interface ValidateProductFormValuesParams {
  invalidFormMessage: string;
  invalidPriceMessage: string;
  canEditPrice?: boolean;
  canUseCatalogSaleUnits?: boolean;
  canUseProductVariants?: boolean;
  priceFormatMode?: CatalogPriceFormatMode;
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

function hasInvalidEnabledVariantPrice(
  values: CreateProductFormValues,
  variantAttributes: AttributeDto[],
  priceFormatMode: CatalogPriceFormatMode,
): boolean {
  return buildVariantMatrixRows(values.variants, variantAttributes).some(
    (row) => {
      if (row.item.status === "DISABLED") {
        return false;
      }

      const rawPrice = row.item.price;
      if (rawPrice === undefined || rawPrice.trim().length === 0) {
        return false;
      }

      const price = Number(rawPrice);
      return !isCatalogPriceValueCompatible(price, priceFormatMode);
    },
  );
}

export function validateProductFormValues({
  invalidFormMessage,
  invalidPriceMessage,
  canEditPrice = true,
  canUseCatalogSaleUnits = false,
  canUseProductVariants = false,
  priceFormatMode = "integer",
  values,
  variantAttributes = [],
  visibleAttributes,
}: ValidateProductFormValuesParams): ValidateProductFormValuesResult {
  const parsedValues = normalizeCreateProductFormValues(values);
  const activeVariantAttributes = canUseProductVariants ? variantAttributes : [];

  if (parsedValues.name.trim().length === 0) {
    return {
      success: false,
      errorMessage: invalidFormMessage,
    };
  }

  const normalizedPrice =
    canEditPrice && parsedValues.price.trim().length > 0
      ? Number(parsedValues.price)
      : null;
  if (
    canEditPrice &&
    normalizedPrice !== null &&
    !isCatalogPriceValueCompatible(normalizedPrice, priceFormatMode)
  ) {
    return {
      success: false,
      errorMessage: invalidPriceMessage,
    };
  }

  if (
    canEditPrice &&
    hasInvalidEnabledVariantPrice(
      parsedValues,
      activeVariantAttributes,
      priceFormatMode,
    )
  ) {
    return {
      success: false,
      errorMessage: invalidPriceMessage,
    };
  }

  if (
    parsedValues.productTypeId &&
    activeVariantAttributes.length > 0 &&
    !hasEnabledVariantCombinations(
      parsedValues.variants,
      activeVariantAttributes,
    )
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

  if (canUseCatalogSaleUnits && canEditPrice) {
    const saleUnitsIssue = validateSaleUnitsForSubmit(
      parsedValues,
      activeVariantAttributes,
      priceFormatMode,
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
