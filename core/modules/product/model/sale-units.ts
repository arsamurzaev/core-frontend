"use client";

export type ProductSaleUnitKind = "piece" | "package" | "pallet";

export interface ProductSaleUnit {
  id: string;
  catalogSaleUnitId: string | null;
  label: string;
  kind: ProductSaleUnitKind;
  price: number;
  baseQuantity: number;
  containsQuantity: number | null;
  containsSaleUnitId: string | null;
  containsSaleUnitLabel: string | null;
  isDefault: boolean;
  isActive: boolean;
  displayOrder: number;
}

type SaleUnitLike = {
  baseQuantity?: unknown;
  catalogSaleUnit?: {
    code?: unknown;
    defaultBaseQuantity?: unknown;
    name?: unknown;
  };
  catalogSaleUnitId?: unknown;
  code?: unknown;
  displayOrder?: unknown;
  id?: unknown;
  isActive?: unknown;
  isDefault?: unknown;
  kind?: unknown;
  label?: unknown;
  name?: unknown;
  price?: unknown;
  quantity?: unknown;
  title?: unknown;
  type?: unknown;
  unit?: unknown;
  unitCode?: unknown;
};

type EntityWithSaleUnits = {
  saleUnits?: unknown;
};

const SALE_UNIT_LABELS: Record<ProductSaleUnitKind, string> = {
  piece: "ед.",
  package: "упаковка",
  pallet: "палета",
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

function roundSaleUnitQuantity(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function isWholeSaleUnitMultiplier(value: number): boolean {
  return Math.abs(value - Math.round(value)) < 0.0001;
}

function resolveContainsSaleUnit(
  unit: ProductSaleUnit,
  previousUnits: ProductSaleUnit[],
):
  | {
      quantity: number;
      saleUnit: ProductSaleUnit;
    }
  | null {
  const parentUnit = previousUnits
    .slice()
    .reverse()
    .find(
      (candidate) => {
        if (
          candidate.baseQuantity <= 0 ||
          candidate.baseQuantity >= unit.baseQuantity
        ) {
          return false;
        }

        return isWholeSaleUnitMultiplier(
          unit.baseQuantity / candidate.baseQuantity,
        );
      },
    );

  if (!parentUnit) {
    return null;
  }

  const quantity = unit.baseQuantity / parentUnit.baseQuantity;

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return null;
  }

  return {
    quantity: roundSaleUnitQuantity(quantity),
    saleUnit: parentUnit,
  };
}

function withContainsInfo(units: ProductSaleUnit[]): ProductSaleUnit[] {
  return units.map((unit, index) => {
    const contains = resolveContainsSaleUnit(unit, units.slice(0, index));

    return {
      ...unit,
      containsQuantity: contains?.quantity ?? null,
      containsSaleUnitId: contains?.saleUnit.id ?? null,
      containsSaleUnitLabel: contains?.saleUnit.label ?? null,
    };
  });
}

function resolveSaleUnitKind(unit: SaleUnitLike): ProductSaleUnitKind {
  const raw = [
    unit.catalogSaleUnit?.code,
    unit.catalogSaleUnit?.name,
    unit.kind,
    unit.type,
    unit.code,
    unit.unitCode,
    unit.unit,
    unit.label,
    unit.name,
    unit.title,
  ]
    .map(normalizeText)
    .find(Boolean)
    ?.toLowerCase();

  if (!raw) {
    return "piece";
  }

  if (
    raw.includes("pallet") ||
    raw.includes("palette") ||
    raw.includes("палет")
  ) {
    return "pallet";
  }

  if (
    raw.includes("pack") ||
    raw.includes("package") ||
    raw.includes("box") ||
    raw.includes("упаков") ||
    raw.includes("короб")
  ) {
    return "package";
  }

  return "piece";
}

export function getProductSaleUnits(entity: unknown): ProductSaleUnit[] {
  const rawSaleUnits = (entity as EntityWithSaleUnits | null | undefined)
    ?.saleUnits;

  if (!Array.isArray(rawSaleUnits)) {
    return [];
  }

  const units = rawSaleUnits
    .map((rawUnit): ProductSaleUnit | null => {
      const unit = rawUnit as SaleUnitLike;
      const id = normalizeText(unit.id);
      const price = toOptionalNumber(unit.price);

      if (!id || price === null) {
        return null;
      }

      const kind = resolveSaleUnitKind(unit);
      const baseQuantity =
        toOptionalNumber(
          unit.baseQuantity ??
            unit.quantity ??
            unit.catalogSaleUnit?.defaultBaseQuantity,
        ) ?? 1;
      const label =
        normalizeText(unit.catalogSaleUnit?.name) ||
        normalizeText(unit.name) ||
        normalizeText(unit.label) ||
        normalizeText(unit.title) ||
        normalizeText(unit.unit) ||
        SALE_UNIT_LABELS[kind];

      return {
        id,
        catalogSaleUnitId: normalizeText(unit.catalogSaleUnitId) || null,
        label,
        kind,
        price,
        baseQuantity: Math.max(0.0001, baseQuantity),
        containsQuantity: null,
        containsSaleUnitId: null,
        containsSaleUnitLabel: null,
        isDefault: unit.isDefault === true,
        isActive: unit.isActive !== false,
        displayOrder: toOptionalNumber(unit.displayOrder) ?? 0,
      };
    })
    .filter((unit): unit is ProductSaleUnit => Boolean(unit))
    .filter((unit) => unit.isActive)
    .sort(
      (left, right) =>
        left.displayOrder - right.displayOrder ||
        left.baseQuantity - right.baseQuantity ||
        left.label.localeCompare(right.label),
    );

  return withContainsInfo(units);
}

export function formatProductSaleUnitQuantity(value: number): string {
  const rounded = roundSaleUnitQuantity(value);
  return Number.isInteger(rounded)
    ? String(rounded)
    : String(rounded).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

export function getProductSaleUnitContainsText(
  unit: ProductSaleUnit,
): string | null {
  if (!unit.containsQuantity || !unit.containsSaleUnitLabel) {
    return null;
  }

  return `Внутри: ${formatProductSaleUnitQuantity(unit.containsQuantity)} ${
    unit.containsSaleUnitLabel
  }`;
}

export function getProductSaleUnitsSummary(entity: unknown): string | null {
  const labels = Array.from(
    new Set(
      getProductSaleUnits(entity)
        .map((unit) => normalizeText(unit.label))
        .filter(Boolean),
    ),
  );

  return labels.length > 0 ? labels.join(" / ") : null;
}

export function getDefaultProductSaleUnit(
  saleUnits: ProductSaleUnit[],
): ProductSaleUnit | null {
  if (saleUnits.length === 0) {
    return null;
  }

  return (
    saleUnits.find((unit) => unit.isDefault) ??
    saleUnits.find((unit) => unit.kind === "piece") ??
    saleUnits
      .slice()
      .sort((left, right) => left.baseQuantity - right.baseQuantity)[0] ??
    null
  );
}

export function findProductSaleUnit(
  saleUnits: ProductSaleUnit[],
  saleUnitId: string | null | undefined,
): ProductSaleUnit | null {
  return saleUnitId
    ? (saleUnits.find((unit) => unit.id === saleUnitId) ?? null)
    : null;
}

export function getSaleUnitMaxQuantity(
  stock: number | null | undefined,
  saleUnit: ProductSaleUnit | null | undefined,
): number | undefined {
  if (typeof stock !== "number" || !Number.isFinite(stock) || stock < 0) {
    return undefined;
  }

  const baseQuantity = Math.max(0.0001, saleUnit?.baseQuantity ?? 1);

  return Math.max(0, Math.floor(stock / baseQuantity));
}
