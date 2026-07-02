import type { CategoryCardVariant } from "@/core/modules/category";
import type { CheckoutMethod } from "@/shared/lib/checkout-methods";

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

export type CatalogRuntimeManifestId = "default" | "restaurant" | "wholesale";

export type CatalogRuntimeAnalyticsEventId =
  | "catalog.view"
  | "catalog.share"
  | "catalog.filter"
  | "product.view"
  | "product.addToCart"
  | "checkout.start"
  | "checkout.submit"
  | "checkout.preorderStart"
  | "manager.orderStart";

export type CatalogRuntimeSlotMode = "default" | "runtime-slot";
export type CatalogRuntimeProductCardMode = "default" | "configured";

export interface CatalogRuntimeCapabilities {
  supportsBrands: boolean;
  supportsCategoryDetails: boolean;
  supportsPreorderCheckout: boolean;
  supportsManagerOrder: boolean;
  hasBrowserSlot: boolean;
  hasCartCardActionSlot: boolean;
}

export interface CatalogRuntimeSlotManifest {
  hasBrowser: boolean;
  hasCartCardAction: boolean;
}

export interface CatalogRuntimePolicies {
  browserMode: CatalogRuntimeSlotMode;
  cartActionMode: CatalogRuntimeSlotMode;
  categoryCardVariant: CategoryCardVariant;
  checkoutMethods: CheckoutMethod[];
  defaultCheckoutMethods: CheckoutMethod[];
  productCardMode: CatalogRuntimeProductCardMode;
}

export interface CatalogRuntimeManifestConfig {
  id: CatalogRuntimeManifestId;
  label: string;
  analyticsEvents?: CatalogRuntimeAnalyticsEventId[];
}

export interface CatalogRuntimeManifest {
  id: CatalogRuntimeManifestId;
  label: string;
  typeCodes: string[];
  capabilities: CatalogRuntimeCapabilities;
  slots: CatalogRuntimeSlotManifest;
  policies: CatalogRuntimePolicies;
  analyticsEvents: CatalogRuntimeAnalyticsEventId[];
}
