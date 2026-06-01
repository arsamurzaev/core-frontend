import { type ProductVariantSaleUnitDtoReq } from "@/shared/api/generated/react-query";
import {
  formatCatalogPriceInputValue,
  isCatalogPriceValueCompatible,
  type CatalogPriceFormatMode,
} from "@/shared/lib/price-format";

export type SaleUnitFormValue = {
  id?: string;
  catalogSaleUnitId?: string;
  catalogSaleUnitName?: string;
  catalogDefaultBaseQuantity?: string;
  label: string;
  baseQuantity: string;
  price: string;
  isDefault: boolean;
};

export type SaleUnitsFormValue = SaleUnitFormValue[];

export type SaleUnitPayload = ProductVariantSaleUnitDtoReq;

export type PayloadWithSaleUnits<T> = T & {
  saleUnits?: SaleUnitPayload[];
};

export type SaleUnitValidationIssue = {
  message: string;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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

function normalizeSaleUnitInput(unit: SaleUnitFormValue): SaleUnitPayload | null {
  const catalogSaleUnitId = normalizeText(unit.catalogSaleUnitId);
  const label =
    normalizeText(unit.catalogSaleUnitName) || normalizeText(unit.label);
  const baseQuantity = toOptionalNumber(unit.baseQuantity);
  const price = toOptionalNumber(unit.price);

  if (!catalogSaleUnitId || baseQuantity === null || price === null) {
    return null;
  }

  const normalizedBaseQuantity = Math.max(0.0001, baseQuantity);

  return sanitizeSaleUnitPayload({
    catalogSaleUnitId,
    name: label || undefined,
    baseQuantity: normalizedBaseQuantity,
    price: Math.max(0, price),
    isDefault: unit.isDefault,
  });
}

function sanitizeSaleUnitPayload(unit: SaleUnitPayload): SaleUnitPayload {
  const payload: SaleUnitPayload = {
    catalogSaleUnitId: unit.catalogSaleUnitId,
    baseQuantity: unit.baseQuantity,
    price: unit.price,
  };

  if (unit.code) {
    payload.code = unit.code;
  }
  if (unit.name) {
    payload.name = unit.name;
  }
  if (unit.barcode !== undefined) {
    payload.barcode = unit.barcode;
  }
  if (unit.isDefault !== undefined) {
    payload.isDefault = unit.isDefault;
  }
  if (unit.isActive !== undefined) {
    payload.isActive = unit.isActive;
  }
  if (unit.displayOrder !== undefined) {
    payload.displayOrder = unit.displayOrder;
  }

  return payload;
}

export function createDefaultSaleUnitFormValue(price = ""): SaleUnitFormValue {
  return {
    catalogSaleUnitId: undefined,
    catalogSaleUnitName: undefined,
    catalogDefaultBaseQuantity: undefined,
    label: "",
    baseQuantity: "1",
    price,
    isDefault: true,
  };
}

export function normalizeSaleUnitsForPayload(
  saleUnits: SaleUnitsFormValue | undefined,
): SaleUnitPayload[] {
  const normalized = (saleUnits ?? [])
    .map(normalizeSaleUnitInput)
    .filter((unit): unit is SaleUnitPayload => unit !== null);

  if (normalized.length === 0) {
    return [];
  }

  const defaultIndex = normalized.findIndex((unit) => unit.isDefault);
  if (defaultIndex === -1) {
    return normalized.map((unit, index) =>
      sanitizeSaleUnitPayload({
        ...unit,
        isDefault: index === 0,
      }),
    );
  }

  return normalized.map((unit, index) =>
    sanitizeSaleUnitPayload({
      ...unit,
      isDefault: index === defaultIndex,
    }),
  );
}

export function isSaleUnitDraftTouched(unit: SaleUnitFormValue): boolean {
  return Boolean(
    normalizeText(unit.catalogSaleUnitId) ||
      normalizeText(unit.catalogSaleUnitName) ||
      normalizeText(unit.label) ||
      normalizeText(unit.price) ||
      normalizeText(unit.baseQuantity),
  );
}

export function validateSaleUnitListForSubmit(
  saleUnits: SaleUnitsFormValue | undefined,
  label: string,
  priceFormatMode: CatalogPriceFormatMode = "integer",
): SaleUnitValidationIssue | null {
  const usedCatalogSaleUnitIds = new Set<string>();

  for (const unit of saleUnits ?? []) {
    if (!isSaleUnitDraftTouched(unit)) {
      continue;
    }

    const catalogSaleUnitId = normalizeText(unit.catalogSaleUnitId);
    const displayName =
      normalizeText(unit.catalogSaleUnitName) || normalizeText(unit.label);
    const baseQuantity = toOptionalNumber(unit.baseQuantity);
    const price = toOptionalNumber(unit.price);

    if (!catalogSaleUnitId && !displayName) {
      return {
        message: `${label}: выберите единицу продажи из справочника.`,
      };
    }

    if (!catalogSaleUnitId) {
      return {
        message: `${label}: выберите единицу продажи из справочника.`,
      };
    }

    if (catalogSaleUnitId) {
      if (usedCatalogSaleUnitIds.has(catalogSaleUnitId)) {
        return {
          message: `${label}: одну единицу продажи нельзя привязать дважды.`,
        };
      }
      usedCatalogSaleUnitIds.add(catalogSaleUnitId);
    }

    if (baseQuantity === null || baseQuantity <= 0) {
      return {
        message: `${label}: проверьте настройки единицы продажи.`,
      };
    }

    if (
      price === null ||
      !isCatalogPriceValueCompatible(price, priceFormatMode)
    ) {
      return {
        message: `${label}: укажите корректную цену единицы продажи.`,
      };
    }
  }

  return null;
}

export function buildSaleUnitsFormValueFromUnknown(
  value: unknown,
  priceFormatMode: CatalogPriceFormatMode = "integer",
): SaleUnitsFormValue {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry): SaleUnitsFormValue => {
    const raw = entry as {
      baseQuantity?: unknown;
      catalogSaleUnit?: {
        defaultBaseQuantity?: unknown;
        name?: unknown;
      };
      catalogSaleUnitId?: unknown;
      id?: unknown;
      isDefault?: unknown;
      label?: unknown;
      name?: unknown;
      price?: unknown;
      quantity?: unknown;
      title?: unknown;
    };
    const label =
      normalizeText(raw.catalogSaleUnit?.name) ||
      normalizeText(raw.label) ||
      normalizeText(raw.name) ||
      normalizeText(raw.title);
    const baseQuantity = toOptionalNumber(
      raw.baseQuantity ?? raw.quantity ?? raw.catalogSaleUnit?.defaultBaseQuantity,
    );
    const catalogDefaultBaseQuantity = toOptionalNumber(
      raw.catalogSaleUnit?.defaultBaseQuantity,
    );
    const price = toOptionalNumber(raw.price);

    if (!label || baseQuantity === null || price === null) {
      return [];
    }

    return [
      {
        id: normalizeText(raw.id) || undefined,
        catalogSaleUnitId: normalizeText(raw.catalogSaleUnitId) || undefined,
        catalogSaleUnitName: normalizeText(raw.catalogSaleUnit?.name) || undefined,
        catalogDefaultBaseQuantity:
          catalogDefaultBaseQuantity === null
            ? undefined
            : String(catalogDefaultBaseQuantity),
        label,
        baseQuantity: String(baseQuantity),
        price: formatCatalogPriceInputValue(price, priceFormatMode),
        isDefault: raw.isDefault === true,
      },
    ];
  });
}
