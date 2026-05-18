import { getCatalogTypeCode } from "@/shared/lib/catalog-type";
import type { CatalogLike } from "@/shared/lib/utils";

export type CatalogPriceFormatMode = "integer" | "decimal";

type PriceFormatCatalog = Pick<CatalogLike, "type"> | null | undefined;

const INTEGER_PRICE_FORMATTER = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

const DECIMAL_PRICE_FORMATTER = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const DECIMAL_PRICE_CATALOG_TYPE_CODES = new Set(["wholesale", "whosale"]);

function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100);
}

export function getCatalogPriceFormatMode(
  catalog: PriceFormatCatalog,
): CatalogPriceFormatMode {
  return DECIMAL_PRICE_CATALOG_TYPE_CODES.has(getCatalogTypeCode(catalog))
    ? "decimal"
    : "integer";
}

export function formatCatalogPrice(
  value: number,
  mode: CatalogPriceFormatMode = "integer",
): string {
  if (mode === "decimal") {
    const roundedCents = roundToCents(value);
    const roundedValue = roundedCents / 100;

    return roundedCents % 100 === 0
      ? INTEGER_PRICE_FORMATTER.format(roundedValue)
      : DECIMAL_PRICE_FORMATTER.format(roundedValue);
  }

  return INTEGER_PRICE_FORMATTER.format(value);
}

export function formatNullableCatalogPrice(
  value: number | null | undefined,
  mode: CatalogPriceFormatMode = "integer",
  fallback = "?",
): string {
  return typeof value === "number" && Number.isFinite(value)
    ? formatCatalogPrice(value, mode)
    : fallback;
}

export function normalizeCatalogPriceValue(
  value: number,
  mode: CatalogPriceFormatMode = "integer",
): number {
  return mode === "decimal"
    ? roundToCents(value) / 100
    : Math.round(value);
}

export function isCatalogPriceValueCompatible(
  value: number,
  mode: CatalogPriceFormatMode = "integer",
): boolean {
  if (!Number.isFinite(value) || value < 0) {
    return false;
  }

  if (mode === "integer") {
    return Math.round(value * 100) % 100 === 0;
  }

  return Math.abs(value * 100 - roundToCents(value)) < 1e-8;
}

export function formatCatalogPriceInputValue(
  value: number,
  mode: CatalogPriceFormatMode = "integer",
): string {
  const normalizedValue = normalizeCatalogPriceValue(value, mode);

  if (mode === "decimal" && !Number.isInteger(normalizedValue)) {
    return normalizedValue.toFixed(2);
  }

  return String(normalizedValue);
}

export function getCatalogPriceInputProps(
  mode: CatalogPriceFormatMode = "integer",
): {
  inputMode: "decimal" | "numeric";
  step: "0.01" | 1;
} {
  return mode === "decimal"
    ? { inputMode: "decimal", step: "0.01" }
    : { inputMode: "numeric", step: 1 };
}
