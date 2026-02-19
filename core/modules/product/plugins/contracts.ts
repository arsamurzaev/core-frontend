export interface ProductCardAttributeSpec {
  key: string;
  fallbackLabel: string;
  fallbackValue?: string;
}

export interface ProductCardPluginConfig {
  attributes: ProductCardAttributeSpec[];
  showVariants?: boolean;
  badges?: string[];
}

export interface ResolvedProductCardPlugin {
  key: string;
  attributes: ProductCardAttributeSpec[];
  showVariants: boolean;
  badges: string[];
}

export interface ProductCardPluginLine {
  id: string;
  label: string;
  value: string;
}

export interface ProductCardPluginModel {
  badges: string[];
  lines: ProductCardPluginLine[];
}
