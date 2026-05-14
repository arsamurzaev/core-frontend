import {
  CREATE_PRODUCT_FORM_DEFAULT_VALUES,
  type CreateProductFormValues,
} from "@/core/modules/product/editor/model/form-config";
import { normalizeProductCategoryIds } from "@/core/modules/product/editor/model/product-category-payload";
import {
  buildSaleUnitsFormValueFromUnknown,
  buildVariantsFormValueFromExisting,
} from "@/core/modules/product/editor/model/product-variants";
import {
  type AttributeDto,
  type ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import { buildEditProductAttributeFormState } from "./edit-product-attribute-values";

export function buildEditProductFormValues(
  product: ProductWithDetailsDto,
  productAttributes: AttributeDto[],
  variantAttributes: AttributeDto[] = [],
): CreateProductFormValues {
  const { attributes, hasDiscount } = buildEditProductAttributeFormState(
    product,
    productAttributes,
  );
  const variants = buildVariantsFormValueFromExisting(
    product.variants ?? [],
    variantAttributes,
  );
  const productSaleUnits = buildSaleUnitsFormValueFromUnknown(
    (product as { saleUnits?: unknown }).saleUnits,
  );
  const defaultVariantSaleUnits = buildSaleUnitsFormValueFromUnknown(
    (product.variants?.find((variant) => variant.attributes.length === 0) as
      | { saleUnits?: unknown }
      | undefined)?.saleUnits,
  );
  const baseSaleUnits =
    productSaleUnits.length > 0 ? productSaleUnits : defaultVariantSaleUnits;

  return {
    ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
    name: product.name,
    price: String(product.price ?? ""),
    productTypeId: product.productType?.id ?? undefined,
    brandId: product.brand?.id ?? undefined,
    categoryIds: normalizeProductCategoryIds(
      product.categories?.map((category) => category.id),
    ),
    hasDiscount,
    attributes,
    saleUnits: baseSaleUnits,
    variants,
  };
}
