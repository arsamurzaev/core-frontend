import type { AttributeDto } from "@/shared/api/generated/react-query";
import type { DynamicFieldConfig } from "@/shared/ui/dynamic-form";
import type { CreateProductFormValues } from "./form-config";
import { findProductAttributeByKey } from "./product-discount";

export type ProductDiscountLinkedFieldMode = "discount" | "discounted-price";

interface PatchProductDiscountFieldsParams {
  fields: DynamicFieldConfig<CreateProductFormValues>[];
  productAttributes: AttributeDto[];
  renderDiscountDateRangeField: (params: {
    relatedAttributeId: string;
  }) => DynamicFieldConfig<CreateProductFormValues>["component"];
  renderDiscountLinkedField: (params: {
    mode: ProductDiscountLinkedFieldMode;
    relatedAttributeId?: string;
  }) => DynamicFieldConfig<CreateProductFormValues>["component"];
  shouldUsePercentDiscountOnly: boolean;
}

function getAttributeFieldName(attribute: AttributeDto | null): string | null {
  return attribute ? `attributes.${attribute.id}` : null;
}

export function patchProductDiscountFields({
  fields,
  productAttributes,
  renderDiscountDateRangeField,
  renderDiscountLinkedField,
  shouldUsePercentDiscountOnly,
}: PatchProductDiscountFieldsParams): DynamicFieldConfig<CreateProductFormValues>[] {
  const discountAttribute = findProductAttributeByKey(
    productAttributes,
    "discount",
  );
  const discountedPriceAttribute = findProductAttributeByKey(
    productAttributes,
    "discountedprice",
  );
  const discountStartAttribute = findProductAttributeByKey(
    productAttributes,
    "discountstartat",
  );
  const discountEndAttribute = findProductAttributeByKey(
    productAttributes,
    "discountendat",
  );

  const discountFieldName = getAttributeFieldName(discountAttribute);
  const discountedPriceFieldName = getAttributeFieldName(
    discountedPriceAttribute,
  );
  const discountStartFieldName = getAttributeFieldName(discountStartAttribute);
  const discountEndFieldName = getAttributeFieldName(discountEndAttribute);
  const discountEndAttributeId = discountEndAttribute?.id ?? null;

  const hasRangePair = Boolean(
    discountStartFieldName && discountEndFieldName,
  );

  if (!discountFieldName && !discountedPriceFieldName && !hasRangePair) {
    return fields;
  }

  return fields
    .filter((field) => {
      if (!discountStartFieldName || !discountEndFieldName) {
        return true;
      }

      return String(field.name) !== discountEndFieldName;
    })
    .map((field) => {
      const fieldName = String(field.name);

      if (discountFieldName && fieldName === discountFieldName) {
        return {
          ...field,
          component: renderDiscountLinkedField({
            mode: "discount",
            relatedAttributeId: shouldUsePercentDiscountOnly
              ? undefined
              : discountedPriceAttribute?.id,
          }),
        };
      }

      if (
        discountStartFieldName &&
        discountEndFieldName &&
        discountEndAttributeId &&
        fieldName === discountStartFieldName
      ) {
        return {
          ...field,
          component: renderDiscountDateRangeField({
            relatedAttributeId: discountEndAttributeId,
          }),
        };
      }

      if (discountedPriceFieldName && fieldName === discountedPriceFieldName) {
        return {
          ...field,
          component: renderDiscountLinkedField({
            mode: "discounted-price",
            relatedAttributeId: discountAttribute?.id,
          }),
        };
      }

      return field;
    });
}
