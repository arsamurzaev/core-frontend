import {
  type AttributeDto,
  AttributeDtoDataType,
  type ProductAttributeValueDto,
} from "@/shared/api/generated";
import { type AttributeFormValue } from "@/core/widgets/create-product-drawer/model/types";

export function isMissingRequiredValue(
  attribute: AttributeDto,
  value: AttributeFormValue | undefined,
): boolean {
  if (!attribute.isRequired) return false;

  if (attribute.dataType === AttributeDtoDataType.BOOLEAN) {
    return typeof value !== "boolean";
  }

  return value === undefined || value === null || value === "";
}

export function buildInitialAttributeValues(
  attributes: AttributeDto[],
): Record<string, AttributeFormValue> {
  const values: Record<string, AttributeFormValue> = {};

  for (const attribute of attributes) {
    if (attribute.dataType === AttributeDtoDataType.BOOLEAN) {
      values[attribute.id] = false;
    }
  }

  return values;
}

export function hasPersistedAttributeValue(
  value: AttributeFormValue | undefined,
): boolean {
  if (typeof value === "boolean") {
    return true;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return value !== null && value !== undefined;
}

export function buildRemovedProductAttributeIds(
  attributes: AttributeDto[],
  initialValues: Record<string, AttributeFormValue>,
  currentValues: Record<string, AttributeFormValue>,
): string[] {
  const removedAttributeIds: string[] = [];

  for (const attribute of attributes) {
    if (attribute.dataType === AttributeDtoDataType.BOOLEAN) {
      continue;
    }

    const initialValue = initialValues[attribute.id];
    const currentValue = currentValues[attribute.id];

    if (
      hasPersistedAttributeValue(initialValue) &&
      !hasPersistedAttributeValue(currentValue)
    ) {
      removedAttributeIds.push(attribute.id);
    }
  }

  return removedAttributeIds;
}

export function sortAttributesByDisplayOrder(
  attributes: AttributeDto[],
): AttributeDto[] {
  return [...attributes].sort((left, right) => {
    if (left.displayOrder !== right.displayOrder) {
      return left.displayOrder - right.displayOrder;
    }
    return left.displayName.localeCompare(right.displayName, "ru");
  });
}

export function buildProductAttributePayload(
  attributes: AttributeDto[],
  values: Record<string, AttributeFormValue>,
): ProductAttributeValueDto[] {
  const payload: ProductAttributeValueDto[] = [];

  for (const attribute of attributes) {
    const rawValue = values[attribute.id];

    if (rawValue === undefined || rawValue === null || rawValue === "") {
      continue;
    }

    if (attribute.dataType === AttributeDtoDataType.ENUM) {
      payload.push({
        attributeId: attribute.id,
        enumValueId: String(rawValue),
      });
      continue;
    }

    if (attribute.dataType === AttributeDtoDataType.STRING) {
      payload.push({
        attributeId: attribute.id,
        valueString: String(rawValue),
      });
      continue;
    }

    if (attribute.dataType === AttributeDtoDataType.INTEGER) {
      const number = Number(rawValue);
      if (Number.isFinite(number)) {
        payload.push({
          attributeId: attribute.id,
          valueInteger: Math.trunc(number),
        });
      }
      continue;
    }

    if (attribute.dataType === AttributeDtoDataType.DECIMAL) {
      const number = Number(rawValue);
      if (Number.isFinite(number)) {
        payload.push({
          attributeId: attribute.id,
          valueDecimal: number,
        });
      }
      continue;
    }

    if (attribute.dataType === AttributeDtoDataType.BOOLEAN) {
      payload.push({
        attributeId: attribute.id,
        valueBoolean: Boolean(rawValue),
      });
      continue;
    }

    if (attribute.dataType === AttributeDtoDataType.DATETIME) {
      const parsed = new Date(String(rawValue));
      payload.push({
        attributeId: attribute.id,
        valueDateTime: Number.isNaN(parsed.getTime())
          ? String(rawValue)
          : parsed.toISOString(),
      });
    }
  }

  return payload;
}
