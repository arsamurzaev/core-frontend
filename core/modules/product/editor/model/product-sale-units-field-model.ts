import {
  type SaleUnitFormValue,
  type SaleUnitsFormValue,
} from "./product-sale-units";
import {
  formatCatalogPrice,
  type CatalogPriceFormatMode,
} from "@/shared/lib/price-format";

export type SaleUnitDraftNamesByIndex = Record<number, string>;

export type SaleUnitDiscountPreview = {
  basePrice: number;
  finalPrice: number;
};

export type SaleUnitRelationDraft = {
  multiplier: string;
  parentIndex: number | null;
};

export type SaleUnitRelationDraftsByIndex = Record<
  number,
  SaleUnitRelationDraft
>;

export function normalizeSaleUnitRows(
  units: SaleUnitsFormValue,
): SaleUnitsFormValue {
  const defaultIndex = units.findIndex((unit) => unit.isDefault);

  if (defaultIndex === -1) {
    return units.map((unit, index) => ({
      ...unit,
      isDefault: index === 0,
    }));
  }

  return units.map((unit, index) => ({
    ...unit,
    isDefault: index === defaultIndex,
  }));
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function toPositiveSaleUnitNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

export function formatSaleUnitQuantity(value: unknown): string {
  const parsed = toPositiveSaleUnitNumber(value);
  return parsed === null ? "1" : String(parsed);
}

export function resolveSaleUnitRelationBaseQuantity(
  multiplier: unknown,
  parentBaseQuantity: unknown,
): string | null {
  const parsedMultiplier = toPositiveSaleUnitNumber(multiplier);
  const parsedParentBaseQuantity = toPositiveSaleUnitNumber(parentBaseQuantity);

  if (parsedMultiplier === null || parsedParentBaseQuantity === null) {
    return null;
  }

  return formatSaleUnitQuantity(parsedMultiplier * parsedParentBaseQuantity);
}

export function applySaleUnitRelationQuantities(
  units: SaleUnitsFormValue,
  relations: SaleUnitRelationDraftsByIndex,
): SaleUnitsFormValue {
  const nextUnits = units.map((unit) => ({ ...unit }));
  const relationIndexes = Object.keys(relations)
    .map((value) => Number(value))
    .filter(Number.isInteger)
    .sort((left, right) => left - right);

  for (const index of relationIndexes) {
    const relation = relations[index];
    const unit = nextUnits[index];
    const parentIndex = relation?.parentIndex;

    if (
      !unit ||
      parentIndex === null ||
      parentIndex === undefined ||
      parentIndex < 0 ||
      parentIndex >= index
    ) {
      continue;
    }

    const parentUnit = nextUnits[parentIndex];
    const baseQuantity = resolveSaleUnitRelationBaseQuantity(
      relation.multiplier,
      parentUnit?.baseQuantity,
    );

    if (baseQuantity) {
      nextUnits[index] = {
        ...unit,
        baseQuantity,
      };
    }
  }

  return nextUnits;
}

export function deriveSaleUnitRelationDrafts(
  units: SaleUnitsFormValue,
): SaleUnitRelationDraftsByIndex {
  return units.reduce<SaleUnitRelationDraftsByIndex>((relations, unit, index) => {
    const baseQuantity = toPositiveSaleUnitNumber(unit.baseQuantity);

    if (index === 0 || baseQuantity === null) {
      return relations;
    }

    const parentEntry = units
      .slice(0, index)
      .map((candidate, candidateIndex) => ({
        baseQuantity: toPositiveSaleUnitNumber(candidate.baseQuantity),
        index: candidateIndex,
      }))
      .reverse()
      .find(
        (candidate) =>
          candidate.baseQuantity !== null &&
          candidate.baseQuantity < baseQuantity,
      );

    if (!parentEntry?.baseQuantity) {
      return relations;
    }

    const multiplier = baseQuantity / parentEntry.baseQuantity;
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      return relations;
    }

    relations[index] = {
      multiplier: formatSaleUnitQuantity(multiplier),
      parentIndex: parentEntry.index,
    };

    return relations;
  }, {});
}

export function resolveSaleUnitRelationDraft(
  localRelation: SaleUnitRelationDraft | undefined,
  derivedRelation: SaleUnitRelationDraft | undefined,
): SaleUnitRelationDraft {
  if (!localRelation) {
    return (
      derivedRelation ?? {
        multiplier: "",
        parentIndex: null,
      }
    );
  }

  const isExplicitEmpty =
    !normalizeText(localRelation.multiplier) &&
    localRelation.parentIndex === null;

  if (isExplicitEmpty) {
    return localRelation;
  }

  return {
    multiplier: normalizeText(localRelation.multiplier),
    parentIndex: localRelation.parentIndex ?? derivedRelation?.parentIndex ?? null,
  };
}

export function getSaleUnitDisplayName(unit: SaleUnitFormValue): string {
  return normalizeText(unit.catalogSaleUnitName) || normalizeText(unit.label);
}

export function formatSaleUnitMoney(
  value: number,
  mode: CatalogPriceFormatMode = "integer",
): string {
  return formatCatalogPrice(value, mode);
}

export function resolveSaleUnitDiscountPreview(
  price: unknown,
  discountPercent: number,
): SaleUnitDiscountPreview | null {
  const basePrice = toPositiveSaleUnitNumber(price);
  if (basePrice === null || discountPercent <= 0) {
    return null;
  }

  return {
    basePrice,
    finalPrice: Math.round(basePrice * (100 - discountPercent)) / 100,
  };
}

export function clearSaleUnitDraftNameAtIndex(
  draftNames: SaleUnitDraftNamesByIndex,
  indexToClear: number,
): SaleUnitDraftNamesByIndex {
  const next = { ...draftNames };
  delete next[indexToClear];
  return next;
}

export function removeSaleUnitDraftNameAtIndex(
  draftNames: SaleUnitDraftNamesByIndex,
  removedIndex: number,
): SaleUnitDraftNamesByIndex {
  return Object.entries(draftNames).reduce<SaleUnitDraftNamesByIndex>(
    (next, [rawIndex, value]) => {
      const index = Number(rawIndex);
      if (!Number.isInteger(index) || index === removedIndex) {
        return next;
      }

      next[index > removedIndex ? index - 1 : index] = value;
      return next;
    },
    {},
  );
}

export function clearSaleUnitRelationAtIndex(
  relations: SaleUnitRelationDraftsByIndex,
  indexToClear: number,
): SaleUnitRelationDraftsByIndex {
  const next = { ...relations };
  delete next[indexToClear];
  return next;
}

export function removeSaleUnitRelationAtIndex(
  relations: SaleUnitRelationDraftsByIndex,
  removedIndex: number,
): SaleUnitRelationDraftsByIndex {
  return Object.entries(relations).reduce<SaleUnitRelationDraftsByIndex>(
    (next, [rawIndex, relation]) => {
      const index = Number(rawIndex);
      if (!Number.isInteger(index) || index === removedIndex) {
        return next;
      }

      const parentIndex = relation.parentIndex;
      if (parentIndex === null || parentIndex === removedIndex) {
        return next;
      }

      const nextIndex = index > removedIndex ? index - 1 : index;
      const nextParentIndex =
        parentIndex > removedIndex ? parentIndex - 1 : parentIndex;

      if (nextParentIndex >= nextIndex) {
        return next;
      }

      next[nextIndex] = {
        ...relation,
        parentIndex: nextParentIndex,
      };
      return next;
    },
    {},
  );
}
