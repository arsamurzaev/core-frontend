import type { CategoryDto } from "@/shared/api/generated/react-query";
import type { CartItemView } from "@/core/modules/cart";
import type { CategoryCardVariant } from "@/core/modules/category";
import type {
  ProductCardPluginConfig,
  ResolvedProductCardPlugin,
} from "@/core/modules/product";
import type { CheckoutMethod } from "@/shared/lib/checkout-methods";
import type React from "react";

export interface BrowserSlotProps {
  className?: string;
  initialCategories?: CategoryDto[];
  catalogTabLabel?: string;
  categoryAdminCreateDescription?: string;
  categoryAdminEditDescription?: string;
  categoryCardVariant?: CategoryCardVariant;
  supportsBrands?: boolean;
  supportsCategoryDetails?: boolean;
}

export interface CartCardActionSlotProps {
  productId: string;
  item?: CartItemView;
}

export interface CatalogPresentationConfig {
  catalogTabLabel: string;
  categoryAdminCreateDescription: string;
  categoryAdminEditDescription: string;
  categoryCardVariant: CategoryCardVariant;
  copySuccessMessage: string;
  shareButtonLabel: string;
  supportsBrands: boolean;
  supportsCategoryDetails: boolean;
}

export interface CatalogCheckoutConfig {
  availableMethods: CheckoutMethod[];
  commentPlaceholder: string;
  defaultEnabledMethods: CheckoutMethod[];
}

export type CatalogThemePresetId = "default" | "restaurant" | "wholesale";

export type CatalogThemeTokenName =
  | "--surface-base"
  | "--surface-raised"
  | "--surface-overlay"
  | "--surface-muted"
  | "--surface-subtle"
  | "--text-primary"
  | "--text-secondary"
  | "--text-muted"
  | "--line-default"
  | "--line-subtle"
  | "--line-strong"
  | "--action-primary"
  | "--action-secondary"
  | "--action-link"
  | "--status-danger"
  | "--status-danger-surface"
  | "--status-warning"
  | "--status-warning-surface"
  | "--status-success"
  | "--status-success-surface"
  | "--status-info"
  | "--status-info-surface"
  | "--semantic-radius-panel"
  | "--semantic-radius-control"
  | "--semantic-radius-pill"
  | "--elevation-surface"
  | "--elevation-control"
  | "--elevation-overlay";

export type CatalogThemeTokenOverrides = Partial<
  Record<CatalogThemeTokenName, string>
>;

export interface CatalogThemePreset {
  id: CatalogThemePresetId;
  label: string;
  scopeClassName: `catalog-theme-${CatalogThemePresetId}`;
  tokenOverrides: CatalogThemeTokenOverrides;
}

export interface CatalogThemeConfig {
  presetId: CatalogThemePresetId;
}

export interface CatalogExtension {
  typeCode: string | string[];
  presentation?: Partial<CatalogPresentationConfig>;
  checkout?: Partial<CatalogCheckoutConfig>;
  theme?: CatalogThemeConfig;
  productCard?: ProductCardPluginConfig;
  cart?: {
    supportsManagerOrder?: boolean;
  };
  slots?: {
    Browser?: React.ComponentType<BrowserSlotProps>;
    CartCardAction?: React.ComponentType<CartCardActionSlotProps>;
  };
}

export type CatalogPlugin = CatalogExtension;

export interface CatalogRuntime {
  extension: CatalogExtension | null;
  typeCode: string;
  presentation: CatalogPresentationConfig;
  checkout: CatalogCheckoutConfig;
  theme: CatalogThemePreset;
  productCard: ResolvedProductCardPlugin;
  cart: {
    supportsManagerOrder: boolean;
  };
  slots: {
    Browser?: React.ComponentType<BrowserSlotProps>;
    CartCardAction?: React.ComponentType<CartCardActionSlotProps>;
  };
}
