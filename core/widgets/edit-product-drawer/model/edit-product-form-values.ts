import {
  createProductEditorFormDefaultValues,
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
import {
  formatCatalogPriceInputValue,
  type CatalogPriceFormatMode,
} from "@/shared/lib/price-format";
import { buildEditProductAttributeFormState } from "./edit-product-attribute-values";

function formatOptionalPriceInputValue(
  value: unknown,
  priceFormatMode: CatalogPriceFormatMode,
): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? formatCatalogPriceInputValue(parsed, priceFormatMode)
    : "";
}

export function buildEditProductFormValues(
  product: ProductWithDetailsDto,
  productAttributes: AttributeDto[],
  variantAttributes: AttributeDto[] = [],
  priceFormatMode: CatalogPriceFormatMode = "integer",
): CreateProductFormValues {
  const { attributes, hasDiscount } = buildEditProductAttributeFormState(
    product,
    productAttributes,
  );
  const variants = buildVariantsFormValueFromExisting(
    product.variants ?? [],
    variantAttributes,
    priceFormatMode,
  );
  const productSaleUnits = buildSaleUnitsFormValueFromUnknown(
    (product as { saleUnits?: unknown }).saleUnits,
    priceFormatMode,
  );
  const defaultVariantSaleUnits = buildSaleUnitsFormValueFromUnknown(
    (product.variants?.find((variant) => variant.attributes.length === 0) as
      | { saleUnits?: unknown }
      | undefined)?.saleUnits,
    priceFormatMode,
  );
  const baseSaleUnits =
    productSaleUnits.length > 0 ? productSaleUnits : defaultVariantSaleUnits;

  return {
    ...createProductEditorFormDefaultValues(),
    name: product.name,
    price: formatOptionalPriceInputValue(product.price, priceFormatMode),
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
