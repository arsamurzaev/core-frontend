import {
  type CreateProductFormValues,
  normalizeOptionalString,
} from "@/core/modules/product/editor/model/form-config";
import { buildProductAttributePayload } from "@/core/modules/product/editor/model/product-attributes";
import { normalizeProductCategoryIds } from "@/core/modules/product/editor/model/product-category-payload";
import type { AttributeDto } from "@/shared/api/generated/react-query";

export interface ProductEditorBasePayloadFields {
  attributes: ReturnType<typeof buildProductAttributePayload>;
  brandId: string | null;
  categories: string[];
  name: string;
  price: number | null;
  productTypeId: string | null;
}

export function buildProductEditorBasePayloadFields(params: {
  formValues: CreateProductFormValues;
  productAttributes: AttributeDto[];
}): ProductEditorBasePayloadFields {
  const { formValues, productAttributes } = params;
  const normalizedPrice =
    formValues.price.trim().length > 0 ? Number(formValues.price) : null;

  return {
    attributes: buildProductAttributePayload(
      productAttributes,
      formValues.attributes ?? {},
    ),
    brandId: normalizeOptionalString(formValues.brandId) ?? null,
    categories: normalizeProductCategoryIds(formValues.categoryIds),
    name: formValues.name.trim(),
    price: normalizedPrice,
    productTypeId: normalizeOptionalString(formValues.productTypeId) ?? null,
  };
}
