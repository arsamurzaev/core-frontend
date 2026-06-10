export interface CatalogModifierOption {
  id: string;
  catalogId: string;
  code: string;
  name: string;
  description: string | null;
  defaultPrice: string;
  isActive: boolean;
  displayOrder: number;
  deleteAt: string | null;
}

export interface CatalogModifierGroupOption {
  groupId: string;
  optionId: string;
  defaultPrice: string | null;
  isDefault: boolean;
  isActive: boolean;
  displayOrder: number;
  option: CatalogModifierOption;
}

export interface CatalogModifierGroup {
  id: string;
  catalogId: string;
  code: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  minSelected: number;
  maxSelected: number | null;
  isActive: boolean;
  displayOrder: number;
  deleteAt: string | null;
  options: CatalogModifierGroupOption[];
}

export interface CatalogModifierState {
  groups: CatalogModifierGroup[];
  options: CatalogModifierOption[];
}

export type ProductModifierScope = "PRODUCT" | "VARIANT";

export interface ProductModifierOption {
  id: string;
  productModifierGroupId: string;
  catalogModifierOptionId: string | null;
  code: string;
  name: string;
  price: string;
  maxQuantity: number | null;
  isDefault: boolean;
  isAvailable: boolean;
  displayOrder: number;
}

export interface ProductModifierGroup {
  id: string;
  productId: string;
  variantId: string | null;
  catalogModifierGroupId: string | null;
  scope: ProductModifierScope;
  code: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  minSelected: number;
  maxSelected: number | null;
  isActive: boolean;
  displayOrder: number;
  options: ProductModifierOption[];
}

export type ProductModifierSelection = Record<string, number>;
