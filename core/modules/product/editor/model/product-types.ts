import {
  AttributeDtoDataType,
  AttributeEnumValueDtoSource,
  type AttributeDto,
  type ProductTypeMatrixEditorAttributeDto,
  type ProductTypeMatrixEditorSchemaDto,
} from "@/shared/api/generated/react-query";

function buildAttributeFromMatrixSchema(
  schema: ProductTypeMatrixEditorSchemaDto,
  attribute: ProductTypeMatrixEditorAttributeDto,
): AttributeDto {
  const enumValuesById = new Map(
    schema.enumValues
      .filter(
        (enumValue) =>
          enumValue.attributeId === attribute.attributeId &&
          !enumValue.isArchived &&
          !enumValue.mergedIntoId,
      )
      .map((enumValue) => [
        enumValue.id,
        {
          id: enumValue.id,
          attributeId: enumValue.attributeId,
          catalogId: enumValue.catalogId,
          value: enumValue.value,
          displayName: enumValue.displayName,
          displayOrder: enumValue.displayOrder,
          businessId: enumValue.businessId,
          source: enumValue.source as AttributeEnumValueDtoSource,
          mergedIntoId: enumValue.mergedIntoId,
          aliases: enumValue.aliases.map((alias) => ({
            ...alias,
            displayName: alias.displayName,
            createdAt: schema.type.createdAt,
            updatedAt: schema.type.updatedAt,
          })),
          createdAt: schema.type.createdAt,
          updatedAt: schema.type.updatedAt,
        },
      ]),
  );

  return {
    id: attribute.attributeId,
    typeIds: [attribute.productTypeId],
    key: attribute.key,
    displayName: attribute.displayName,
    dataType: attribute.dataType as AttributeDtoDataType,
    isRequired: attribute.isRequired,
    isVariantAttribute: attribute.isVariant,
    isFilterable: attribute.isFilterable,
    displayOrder: attribute.displayOrder,
    isHidden: attribute.isHidden,
    createdAt: schema.type.createdAt,
    updatedAt: schema.type.updatedAt,
    enumValues: Array.from(enumValuesById.values()).sort(
      (left, right) =>
        left.displayOrder - right.displayOrder ||
        left.value.localeCompare(right.value),
    ),
  };
}

export function buildAttributesFromProductTypeMatrixSchema(
  schema: ProductTypeMatrixEditorSchemaDto | null | undefined,
): AttributeDto[] | null {
  if (!schema) {
    return null;
  }

  const attributesById = new Map<string, AttributeDto>();

  for (const attribute of schema.attributes) {
    attributesById.set(
      attribute.attributeId,
      buildAttributeFromMatrixSchema(schema, attribute),
    );
  }

  for (const attribute of schema.variantAttributes) {
    attributesById.set(
      attribute.attributeId,
      buildAttributeFromMatrixSchema(schema, attribute),
    );
  }

  return Array.from(attributesById.values());
}
