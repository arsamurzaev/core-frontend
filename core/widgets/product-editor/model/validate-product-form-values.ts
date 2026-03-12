"use client";

import {
  createProductFormSchema,
  type CreateProductFormValues,
} from "@/core/widgets/create-product-drawer/model/form-config";
import { formatGeneratedZodError } from "@/core/widgets/create-product-drawer/lib/errors";
import { isMissingRequiredValue } from "@/core/widgets/create-product-drawer/model/product-attributes";
import {
  type AttributeDto,
  AttributeDtoDataType,
} from "@/shared/api/generated";

interface ValidateProductFormValuesParams {
  invalidFormMessage: string;
  invalidPriceMessage: string;
  values: CreateProductFormValues;
  visibleAttributes: AttributeDto[];
}

type ValidateProductFormValuesResult =
  | {
      success: true;
      errorMessage: null;
      normalizedPrice: number;
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
  values,
  visibleAttributes,
}: ValidateProductFormValuesParams): ValidateProductFormValuesResult {
  const parsedValues = createProductFormSchema.safeParse(values);
  if (!parsedValues.success) {
    return {
      success: false,
      errorMessage: formatGeneratedZodError(
        parsedValues.error,
        invalidFormMessage,
      ),
    };
  }

  const normalizedPrice = Number(parsedValues.data.price);
  if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
    return {
      success: false,
      errorMessage: invalidPriceMessage,
    };
  }

  for (const attribute of visibleAttributes) {
    const value = parsedValues.data.attributes[attribute.id];

    if (isMissingRequiredValue(attribute, value)) {
      return {
        success: false,
        errorMessage:
          "\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u0430\u0442\u0440\u0438\u0431\u0443\u0442 " +
          `"${attribute.displayName}".`,
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
        errorMessage:
          `\u0410\u0442\u0440\u0438\u0431\u0443\u0442 "${attribute.displayName}" ` +
          "\u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u0447\u0438\u0441\u043b\u043e\u043c.",
      };
    }
  }

  return {
    success: true,
    errorMessage: null,
    normalizedPrice,
    parsedValues: parsedValues.data,
  };
}
