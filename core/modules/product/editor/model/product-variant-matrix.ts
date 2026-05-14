import { type AttributeDto } from "@/shared/api/generated/react-query";
import {
  createDefaultVariantCombinationFormValue,
  normalizeVariantsFormValue,
} from "./product-variant-form";
import {
  VARIANT_COMBINATION_PART_SEPARATOR,
  VARIANT_COMBINATION_VALUE_SEPARATOR,
  type VariantCombinationAttributeValue,
  type VariantMatrixRow,
} from "./product-variant-types";

function getAttributeOrderMap(
  variantAttributes: AttributeDto[] = [],
): Map<string, number> {
  return new Map(variantAttributes.map((attribute, index) => [attribute.id, index]));
}

export function orderVariantCombinationAttributes(
  attributes: VariantCombinationAttributeValue[],
  variantAttributes: AttributeDto[] = [],
): VariantCombinationAttributeValue[] {
  const orderMap = getAttributeOrderMap(variantAttributes);

  return [...attributes].sort((left, right) => {
    const leftOrder = orderMap.get(left.attributeId) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = orderMap.get(right.attributeId) ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.attributeId.localeCompare(right.attributeId);
  });
}

export function buildVariantCombinationKey(
  attributes: VariantCombinationAttributeValue[],
  variantAttributes: AttributeDto[] = [],
): string {
  return orderVariantCombinationAttributes(attributes, variantAttributes)
    .map(
      (attribute) =>
        `${attribute.attributeId}${VARIANT_COMBINATION_VALUE_SEPARATOR}${attribute.enumValueId}`,
    )
    .join(VARIANT_COMBINATION_PART_SEPARATOR);
}

export function parseVariantCombinationKey(
  key: string,
): VariantCombinationAttributeValue[] {
  return key
    .split(VARIANT_COMBINATION_PART_SEPARATOR)
    .flatMap((part): VariantCombinationAttributeValue[] => {
      const separatorIndex = part.indexOf(VARIANT_COMBINATION_VALUE_SEPARATOR);
      if (separatorIndex <= 0) {
        return [];
      }

      const attributeId = part.slice(0, separatorIndex);
      const enumValueId = part.slice(separatorIndex + 1);
      if (!attributeId || !enumValueId) {
        return [];
      }

      return [{ attributeId, enumValueId }];
    });
}

function getEnumValueLabel(attribute: AttributeDto, enumValueId: string): string {
  const enumValue = (attribute.enumValues ?? []).find(
    (value) => value.id === enumValueId,
  );

  return enumValue?.displayName || enumValue?.value || enumValueId;
}

function buildCombinationLabel(
  attributes: VariantCombinationAttributeValue[],
  variantAttributes: AttributeDto[],
): string {
  const attributeMap = new Map(
    variantAttributes.map((attribute) => [attribute.id, attribute]),
  );

  return orderVariantCombinationAttributes(attributes, variantAttributes)
    .map((attributeValue) => {
      const attribute = attributeMap.get(attributeValue.attributeId);
      if (!attribute) {
        return attributeValue.enumValueId;
      }

      return getEnumValueLabel(attribute, attributeValue.enumValueId);
    })
    .join(" + ");
}

function getAllowedEnumValueIds(attribute: AttributeDto): Set<string> {
  return new Set((attribute.enumValues ?? []).map((enumValue) => enumValue.id));
}

function buildCartesianProduct(
  attributes: AttributeDto[],
  valuesByAttributeId: Record<string, string[]>,
): VariantCombinationAttributeValue[][] {
  return attributes.reduce<VariantCombinationAttributeValue[][]>(
    (combinations, attribute) => {
      const values = valuesByAttributeId[attribute.id] ?? [];
      if (values.length === 0) {
        return [];
      }

      return combinations.flatMap((combination) =>
        values.map((enumValueId) => [
          ...combination,
          { attributeId: attribute.id, enumValueId },
        ]),
      );
    },
    [[]],
  );
}

export function buildVariantMatrixRows(
  variantsFormValue: unknown,
  variantAttributes: AttributeDto[] = [],
): VariantMatrixRow[] {
  if (variantAttributes.length === 0) {
    return [];
  }

  const normalized = normalizeVariantsFormValue(variantsFormValue);
  const attributeById = new Map(
    variantAttributes.map((attribute) => [attribute.id, attribute]),
  );
  const selectedAttributes = normalized.selectedAttributeIds
    .map((attributeId) => attributeById.get(attributeId))
    .filter((attribute): attribute is AttributeDto => Boolean(attribute));

  if (selectedAttributes.length === 0) {
    return [];
  }

  const selectedValueIdsByAttributeId: Record<string, string[]> = {};
  for (const attribute of selectedAttributes) {
    const allowedValueIds = getAllowedEnumValueIds(attribute);
    selectedValueIdsByAttributeId[attribute.id] = (
      normalized.selectedValueIdsByAttributeId[attribute.id] ?? []
    ).filter((enumValueId) => allowedValueIds.has(enumValueId));
  }

  const combinations = buildCartesianProduct(
    selectedAttributes,
    selectedValueIdsByAttributeId,
  );

  return combinations.map((attributes) => {
    const key = buildVariantCombinationKey(attributes, variantAttributes);
    return {
      attributes,
      item:
        normalized.combinations[key] ??
        createDefaultVariantCombinationFormValue(),
      key,
      label: buildCombinationLabel(attributes, variantAttributes),
    };
  });
}

export function hasEnabledVariantCombinations(
  variantsFormValue: unknown,
  variantAttributes: AttributeDto[] = [],
): boolean {
  return buildVariantMatrixRows(variantsFormValue, variantAttributes).some(
    (row) => row.item.status !== "DISABLED",
  );
}
