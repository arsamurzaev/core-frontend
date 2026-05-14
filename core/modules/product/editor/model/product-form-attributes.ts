import {
  AttributeDtoDataType,
  type AttributeDto,
} from "@/shared/api/generated/react-query";
import { sortAttributesByDisplayOrder } from "./product-attributes";

const EMPTY_ATTRIBUTES: AttributeDto[] = [];

export function shouldResolveProductTypeAttributes(params: {
  canUseProductTypes: boolean;
  productTypeId?: string | null;
  useSelectedProductTypeSchema: boolean;
}): boolean {
  return (
    params.canUseProductTypes &&
    params.useSelectedProductTypeSchema &&
    Boolean(params.productTypeId)
  );
}

export function resolveProductTypeAttributes(params: {
  matrixAttributes: AttributeDto[] | null | undefined;
  shouldResolveFromProductType: boolean;
}): AttributeDto[] {
  return params.shouldResolveFromProductType
    ? (params.matrixAttributes ?? EMPTY_ATTRIBUTES)
    : EMPTY_ATTRIBUTES;
}

export function mergeProductEditorAttributes(params: {
  productTypeAttributes: AttributeDto[];
  sourceAttributes: AttributeDto[] | null | undefined;
}): AttributeDto[] {
  const attributesById = new Map<string, AttributeDto>();

  for (const attribute of params.sourceAttributes ?? EMPTY_ATTRIBUTES) {
    attributesById.set(attribute.id, attribute);
  }

  for (const attribute of params.productTypeAttributes) {
    const baseAttribute = attributesById.get(attribute.id);
    attributesById.set(attribute.id, {
      ...baseAttribute,
      ...attribute,
      enumValues:
        attribute.enumValues?.length || !baseAttribute
          ? attribute.enumValues
          : baseAttribute.enumValues,
    });
  }

  return [...attributesById.values()];
}

export function getProductEditorProductAttributes(
  attributes: AttributeDto[],
): AttributeDto[] {
  return sortAttributesByDisplayOrder(
    attributes.filter(
      (attribute) => !attribute.isHidden && !attribute.isVariantAttribute,
    ),
  );
}

export function getProductEditorVariantAttributes(params: {
  canUseProductVariants: boolean;
  isMatrixSchemaError: boolean;
  productTypeAttributes: AttributeDto[];
  shouldResolveFromProductType: boolean;
}): AttributeDto[] {
  if (
    !params.canUseProductVariants ||
    !params.shouldResolveFromProductType ||
    params.isMatrixSchemaError
  ) {
    return EMPTY_ATTRIBUTES;
  }

  return sortAttributesByDisplayOrder(
    params.productTypeAttributes.filter(
      (attribute) =>
        !attribute.isHidden &&
        attribute.isVariantAttribute &&
        attribute.dataType === AttributeDtoDataType.ENUM,
    ),
  );
}
