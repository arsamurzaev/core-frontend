import { ProductAttributeRefDtoDataType } from "@/shared/api/generated";
import type {
  AttributeDtoDataType,
  ProductAttributeDto,
  ProductAttributeValueDto,
} from "@/shared/api/generated";

export type ParsedAttributeValue = string | number | boolean | null;

export type AttributeDataType =
  | ProductAttributeRefDtoDataType
  | AttributeDtoDataType;

export type ParsedAttribute = {
  id: string;
  attributeId: string;
  key: string;
  displayName: string;
  dataType: ProductAttributeRefDtoDataType;
  value: ParsedAttributeValue;
  enumValueId: string | null;
  raw: ProductAttributeDto;
};

export type ParsedAttributeValueEntry = {
  attributeId: string;
  key?: string;
  dataType?: AttributeDataType;
  value: ParsedAttributeValue;
  enumValueId?: string;
  raw: ProductAttributeValueDto;
};

export type ParseOptions<Raw> = {
  keep?: "first" | "last";
  onDuplicate?: (key: string, prev: Raw, next: Raw) => void;
};

const parseAttributesCache = new WeakMap<
  ProductAttributeDto[],
  Record<string, ParsedAttribute>
>();

const isBoolean = (value: boolean | null | undefined): value is boolean =>
  typeof value === "boolean";

export const toNonEmptyString = (
  value: ParsedAttributeValue,
): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export const toBooleanValue = (
  value: ParsedAttributeValue,
): boolean | null => (typeof value === "boolean" ? value : null);

export const toInt = (
  value: string | number | null | undefined,
): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    return null;
  }

  return Math.trunc(num);
};

export const toNumberValue = (
  value: ParsedAttributeValue,
): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  if (!value.trim()) {
    return null;
  }

  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const toNumberIntValue = (
  value: ParsedAttributeValue,
): number | null => {
  if (typeof value === "number" || typeof value === "string") {
    return toInt(value);
  }

  return null;
};

export function parseAttributeValue(
  attr: ProductAttributeDto,
): ParsedAttributeValue {
  switch (attr.attribute.dataType) {
    case ProductAttributeRefDtoDataType.ENUM:
      return attr.enumValue?.displayName ?? attr.enumValue?.value ?? null;
    case ProductAttributeRefDtoDataType.INTEGER:
      return toInt(attr.valueInteger);
    case ProductAttributeRefDtoDataType.DECIMAL:
      return toNumberValue(attr.valueDecimal ?? null);
    case ProductAttributeRefDtoDataType.BOOLEAN:
      return isBoolean(attr.valueBoolean) ? attr.valueBoolean : null;
    case ProductAttributeRefDtoDataType.DATETIME:
      return attr.valueDateTime ?? null;
    case ProductAttributeRefDtoDataType.STRING:
    default:
      return attr.valueString ?? null;
  }
}

export function parseAttribute(attr: ProductAttributeDto): ParsedAttribute {
  return {
    id: attr.id,
    attributeId: attr.attributeId,
    key: attr.attribute.key,
    displayName: attr.attribute.displayName,
    dataType: attr.attribute.dataType,
    value: parseAttributeValue(attr),
    enumValueId: attr.enumValueId,
    raw: attr,
  };
}

export function parseAttributeValueFromValueDto(
  attr: ProductAttributeValueDto,
  dataType?: AttributeDataType,
): ParsedAttributeValue {
  if (dataType) {
    switch (dataType) {
      case ProductAttributeRefDtoDataType.ENUM:
        return attr.enumValueId ?? null;
      case ProductAttributeRefDtoDataType.INTEGER:
        return toInt(attr.valueInteger);
      case ProductAttributeRefDtoDataType.DECIMAL:
        return toNumberValue(attr.valueDecimal ?? null);
      case ProductAttributeRefDtoDataType.BOOLEAN:
        return isBoolean(attr.valueBoolean) ? attr.valueBoolean : null;
      case ProductAttributeRefDtoDataType.DATETIME:
        return attr.valueDateTime ?? null;
      case ProductAttributeRefDtoDataType.STRING:
      default:
        return attr.valueString ?? null;
    }
  }

  if (attr.enumValueId) {
    return attr.enumValueId;
  }

  if (attr.valueInteger !== undefined) {
    return toInt(attr.valueInteger);
  }

  if (attr.valueDecimal !== undefined) {
    return toNumberValue(attr.valueDecimal);
  }

  if (attr.valueBoolean !== undefined) {
    return isBoolean(attr.valueBoolean) ? attr.valueBoolean : null;
  }

  if (attr.valueDateTime !== undefined) {
    return attr.valueDateTime ?? null;
  }

  if (attr.valueString !== undefined) {
    return attr.valueString ?? null;
  }

  return null;
}

export function parseAttributes(
  attrs: ProductAttributeDto[] | null | undefined,
  options?: ParseOptions<ParsedAttribute>,
): Record<string, ParsedAttribute> {
  const result: Record<string, ParsedAttribute> = {};
  if (!attrs) {
    return result;
  }

  if (!options) {
    const cached = parseAttributesCache.get(attrs);
    if (cached) {
      return cached;
    }
  }

  const keep = options?.keep ?? "last";
  for (const attr of attrs) {
    if (!attr?.attribute?.key) {
      continue;
    }

    const next = parseAttribute(attr);
    const key = next.key;
    const prev = result[key];

    if (prev) {
      options?.onDuplicate?.(key, prev, next);
      if (keep === "first") {
        continue;
      }
    }

    result[key] = next;
  }

  if (!options) {
    parseAttributesCache.set(attrs, result);
  }

  return result;
}

export function parseAttributeValuesById(
  attrs: ProductAttributeValueDto[] | null | undefined,
  dataTypeById?: Record<string, AttributeDataType>,
  options?: ParseOptions<ParsedAttributeValueEntry>,
): Record<string, ParsedAttributeValueEntry> {
  const result: Record<string, ParsedAttributeValueEntry> = {};
  if (!attrs) {
    return result;
  }

  const keep = options?.keep ?? "last";
  for (const attr of attrs) {
    if (!attr?.attributeId) {
      continue;
    }

    const dataType = dataTypeById?.[attr.attributeId];
    const next: ParsedAttributeValueEntry = {
      attributeId: attr.attributeId,
      dataType,
      value: parseAttributeValueFromValueDto(attr, dataType),
      enumValueId: attr.enumValueId,
      raw: attr,
    };
    const prev = result[attr.attributeId];

    if (prev) {
      options?.onDuplicate?.(attr.attributeId, prev, next);
      if (keep === "first") {
        continue;
      }
    }

    result[attr.attributeId] = next;
  }

  return result;
}

export function parseAttributeValuesByKey(
  attrs: ProductAttributeValueDto[] | null | undefined,
  keyById: Record<string, string> | null | undefined,
  dataTypeById?: Record<string, AttributeDataType>,
  options?: ParseOptions<ParsedAttributeValueEntry>,
): Record<string, ParsedAttributeValueEntry> {
  const result: Record<string, ParsedAttributeValueEntry> = {};
  if (!attrs || !keyById) {
    return result;
  }

  const keep = options?.keep ?? "last";
  for (const attr of attrs) {
    if (!attr?.attributeId) {
      continue;
    }

    const key = keyById[attr.attributeId];
    if (!key) {
      continue;
    }

    const dataType = dataTypeById?.[attr.attributeId];
    const next: ParsedAttributeValueEntry = {
      attributeId: attr.attributeId,
      key,
      dataType,
      value: parseAttributeValueFromValueDto(attr, dataType),
      enumValueId: attr.enumValueId,
      raw: attr,
    };
    const prev = result[key];

    if (prev) {
      options?.onDuplicate?.(key, prev, next);
      if (keep === "first") {
        continue;
      }
    }

    result[key] = next;
  }

  return result;
}

export function getAttributeByKey(
  attrs: ProductAttributeDto[] | null | undefined,
  key: string,
): ProductAttributeDto | undefined {
  if (!attrs) {
    return undefined;
  }

  return attrs.find((attr) => attr.attribute?.key === key);
}

export function getAttributeById(
  attrs: ProductAttributeDto[] | null | undefined,
  attributeId: string,
): ProductAttributeDto | undefined {
  if (!attrs) {
    return undefined;
  }

  return attrs.find((attr) => attr.attributeId === attributeId);
}

export function getAttributeValueByKey(
  attrs: ProductAttributeDto[] | null | undefined,
  key: string,
  fallback: ParsedAttributeValue = null,
): ParsedAttributeValue {
  const attr = getAttributeByKey(attrs, key);
  if (!attr) {
    return fallback;
  }

  const value = parseAttributeValue(attr);
  return value ?? fallback;
}

export function getAttributeValueById(
  attrs: ProductAttributeDto[] | null | undefined,
  attributeId: string,
  fallback: ParsedAttributeValue = null,
): ParsedAttributeValue {
  const attr = getAttributeById(attrs, attributeId);
  if (!attr) {
    return fallback;
  }

  const value = parseAttributeValue(attr);
  return value ?? fallback;
}

export function getAttributeValueByKeyFromValues(
  attrs: ProductAttributeValueDto[] | null | undefined,
  key: string,
  keyById: Record<string, string> | null | undefined,
  dataTypeById?: Record<string, AttributeDataType>,
  fallback: ParsedAttributeValue = null,
): ParsedAttributeValue {
  if (!attrs || !keyById) {
    return fallback;
  }

  const entry = attrs.find(
    (attr) => attr.attributeId && keyById[attr.attributeId] === key,
  );
  if (!entry) {
    return fallback;
  }

  const value = parseAttributeValueFromValueDto(
    entry,
    dataTypeById?.[entry.attributeId],
  );
  return value ?? fallback;
}

export function pickAttributeValues<const Keys extends readonly string[]>(
  attrs: ProductAttributeDto[] | null | undefined,
  keys: Keys,
  fallback: ParsedAttributeValue = null,
): Record<Keys[number], ParsedAttributeValue> {
  const result = {} as Record<Keys[number], ParsedAttributeValue>;

  for (const key of keys) {
    result[key as Keys[number]] = fallback;
  }

  if (!attrs) {
    return result;
  }

  const parsed = parseAttributes(attrs);
  for (const key of keys) {
    const value = parsed[key]?.value;
    result[key as Keys[number]] = value ?? fallback;
  }

  return result;
}

export function pickAttributeValuesFromValues<
  const Keys extends readonly string[],
>(
  attrs: ProductAttributeValueDto[] | null | undefined,
  keys: Keys,
  keyById: Record<string, string> | null | undefined,
  dataTypeById?: Record<string, AttributeDataType>,
  fallback: ParsedAttributeValue = null,
): Record<Keys[number], ParsedAttributeValue> {
  const result = {} as Record<Keys[number], ParsedAttributeValue>;

  for (const key of keys) {
    result[key as Keys[number]] = fallback;
  }

  if (!attrs || !keyById) {
    return result;
  }

  const wanted = new Set(keys);
  for (const attr of attrs) {
    const key = attr?.attributeId ? keyById[attr.attributeId] : undefined;
    if (!key || !wanted.has(key)) {
      continue;
    }

    const value = parseAttributeValueFromValueDto(
      attr,
      dataTypeById?.[attr.attributeId],
    );
    result[key as Keys[number]] = value ?? fallback;
  }

  return result;
}
