import { type SaleUnitsFormValue } from "./product-sale-units";

export type VariantStatus = "ACTIVE" | "OUT_OF_STOCK" | "DISABLED";

export type VariantItemFormValue = {
  price?: string;
  saleUnits?: SaleUnitsFormValue;
  status: VariantStatus;
  stock: number;
};

export type VariantCombinationFormValue = VariantItemFormValue;

export type VariantCombinationAttributeValue = {
  attributeId: string;
  enumValueId: string;
};

export type VariantsFormValue = {
  selectedAttributeIds: string[];
  selectedValueIdsByAttributeId: Record<string, string[]>;
  combinations: Record<string, VariantCombinationFormValue>;
};

export type VariantMatrixRow = {
  attributes: VariantCombinationAttributeValue[];
  item: VariantCombinationFormValue;
  key: string;
  label: string;
};

export const VARIANT_STATUS_CYCLE: VariantStatus[] = [
  "DISABLED",
  "ACTIVE",
  "OUT_OF_STOCK",
];

export const VARIANT_COMBINATION_PART_SEPARATOR = "|";
export const VARIANT_COMBINATION_VALUE_SEPARATOR = "=";
