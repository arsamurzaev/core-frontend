import { getCatalogTypeCode } from "@/shared/lib/catalog-type";
import type { CatalogPriceFormatMode } from "@/shared/lib/price-format";
import type { CatalogLike } from "@/shared/lib/utils";
import {
  WHOLESALE_PRICING,
  WHOLESALE_TYPE_CODES,
} from "./extensions/wholesale/wholesale.metadata";
import type { CatalogPricingConfig } from "./runtime-contracts";

export const DEFAULT_CATALOG_PRICING: CatalogPricingConfig = {
  priceFormatMode: "integer",
};

const CATALOG_PRICING_BY_TYPE_CODE = new Map<string, CatalogPricingConfig>(
  WHOLESALE_TYPE_CODES.map((typeCode) => [typeCode, WHOLESALE_PRICING]),
);

export function resolveCatalogRuntimePricing(
  catalog?: Pick<CatalogLike, "type"> | null,
): CatalogPricingConfig {
  return (
    CATALOG_PRICING_BY_TYPE_CODE.get(getCatalogTypeCode(catalog)) ??
    DEFAULT_CATALOG_PRICING
  );
}

export function getCatalogPriceFormatMode(
  catalog?: Pick<CatalogLike, "type"> | null,
): CatalogPriceFormatMode {
  return resolveCatalogRuntimePricing(catalog).priceFormatMode;
}
