import { type SaleUnitsFormValue } from "./product-sale-units";
import {
  VARIANT_COMBINATION_VALUE_SEPARATOR,
  VARIANT_STATUS_CYCLE,
  type VariantCombinationFormValue,
  type VariantStatus,
  type VariantsFormValue,
} from "./product-variant-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toOptionalNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeStock(value: unknown): number {
  const parsed = toOptionalNumber(value);
  if (parsed === null || parsed < 0) {
    return 0;
  }

  return Math.floor(parsed);
}

function isVariantStatus(value: unknown): value is VariantStatus {
  return (
    value === "ACTIVE" ||
    value === "OUT_OF_STOCK" ||
    value === "DISABLED"
  );
}

export function createDefaultVariantCombinationFormValue(): VariantCombinationFormValue {
  return {
    status: "DISABLED",
    stock: 0,
  };
}

export function createEmptyVariantsFormValue(): VariantsFormValue {
  return {
    selectedAttributeIds: [],
    selectedValueIdsByAttributeId: {},
    combinations: {},
  };
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function normalizeCombinationItem(value: unknown): VariantCombinationFormValue {
  if (!isRecord(value)) {
    return createDefaultVariantCombinationFormValue();
  }

  const price =
    typeof value.price === "string"
      ? value.price
      : typeof value.price === "number" && Number.isFinite(value.price)
        ? String(value.price)
        : undefined;

  return {
    ...(price !== undefined ? { price } : {}),
    saleUnits: Array.isArray(value.saleUnits)
      ? (value.saleUnits as SaleUnitsFormValue)
      : undefined,
    status: isVariantStatus(value.status) ? value.status : "DISABLED",
    stock: normalizeStock(value.stock),
  };
}

function buildSingleAttributeCombinationKey(
  attributeId: string,
  enumValueId: string,
): string {
  return `${attributeId}${VARIANT_COMBINATION_VALUE_SEPARATOR}${enumValueId}`;
}

function normalizeLegacyVariantsFormValue(
  value: Record<string, unknown>,
): VariantsFormValue {
  const next = createEmptyVariantsFormValue();

  for (const [attributeId, rawEnumValues] of Object.entries(value)) {
    if (!isRecord(rawEnumValues)) {
      continue;
    }

    next.selectedAttributeIds.push(attributeId);
    next.selectedValueIdsByAttributeId[attributeId] = Object.keys(rawEnumValues);

    for (const [enumValueId, rawItem] of Object.entries(rawEnumValues)) {
      const key = buildSingleAttributeCombinationKey(attributeId, enumValueId);
      next.combinations[key] = normalizeCombinationItem(rawItem);
    }
  }

  return next;
}

export function normalizeVariantsFormValue(value: unknown): VariantsFormValue {
  if (!isRecord(value)) {
    return createEmptyVariantsFormValue();
  }

  if (!Array.isArray(value.selectedAttributeIds)) {
    return normalizeLegacyVariantsFormValue(value);
  }

  const selectedAttributeIds = normalizeStringArray(value.selectedAttributeIds);
  const selectedValueIdsByAttributeId: Record<string, string[]> = {};
  const combinations: Record<string, VariantCombinationFormValue> = {};

  if (isRecord(value.selectedValueIdsByAttributeId)) {
    for (const [attributeId, enumValueIds] of Object.entries(
      value.selectedValueIdsByAttributeId,
    )) {
      selectedValueIdsByAttributeId[attributeId] =
        normalizeStringArray(enumValueIds);
    }
  }

  if (isRecord(value.combinations)) {
    for (const [key, item] of Object.entries(value.combinations)) {
      combinations[key] = normalizeCombinationItem(item);
    }
  }

  return {
    selectedAttributeIds,
    selectedValueIdsByAttributeId,
    combinations,
  };
}

export function nextVariantStatus(current: VariantStatus): VariantStatus {
  const index = VARIANT_STATUS_CYCLE.indexOf(current);
  return VARIANT_STATUS_CYCLE[(index + 1) % VARIANT_STATUS_CYCLE.length];
}
