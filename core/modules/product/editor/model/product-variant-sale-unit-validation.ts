import { type AttributeDto } from "@/shared/api/generated/react-query";
import { type CatalogPriceFormatMode } from "@/shared/lib/price-format";
import {
  validateSaleUnitListForSubmit,
  type SaleUnitValidationIssue,
  type SaleUnitsFormValue,
} from "./product-sale-units";
import { buildVariantMatrixRows } from "./product-variant-matrix";
import { type VariantsFormValue } from "./product-variant-types";

export function validateSaleUnitsForSubmit(
  values: {
    saleUnits?: SaleUnitsFormValue;
    variants?: VariantsFormValue;
  },
  variantAttributes: AttributeDto[] = [],
  priceFormatMode: CatalogPriceFormatMode = "integer",
): SaleUnitValidationIssue | null {
  const shouldValidateBaseSaleUnits = variantAttributes.length === 0;
  const baseIssue = validateSaleUnitListForSubmit(
    shouldValidateBaseSaleUnits ? values.saleUnits : undefined,
    "Единицы продажи",
    priceFormatMode,
  );
  if (baseIssue) {
    return baseIssue;
  }

  const rows = buildVariantMatrixRows(values.variants, variantAttributes);
  for (const row of rows) {
    if (row.item.status === "DISABLED") {
      continue;
    }

    const issue = validateSaleUnitListForSubmit(
      row.item.saleUnits,
      `Единицы продажи для ${row.label}`,
      priceFormatMode,
    );
    if (issue) {
      return issue;
    }
  }

  return null;
}
