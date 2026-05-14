import {
  type SaleUnitFormValue,
  type SaleUnitsFormValue,
} from "./product-sale-units";

export type SaleUnitDraftNamesByIndex = Record<number, string>;

export type SaleUnitDiscountPreview = {
  basePrice: number;
  finalPrice: number;
};

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
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

export function formatSaleUnitQuantity(value: unknown): string {
  const parsed = toPositiveSaleUnitNumber(value);
  return parsed === null ? "1" : String(parsed);
}

export function getSaleUnitDisplayName(unit: SaleUnitFormValue): string {
  return normalizeText(unit.catalogSaleUnitName) || normalizeText(unit.label);
}

export function formatSaleUnitMoney(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
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
