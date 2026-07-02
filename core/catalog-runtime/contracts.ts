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

export interface CatalogExtension {
  typeCode: string | string[];
  presentation?: Partial<CatalogPresentationConfig>;
  checkout?: Partial<CatalogCheckoutConfig>;
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
  productCard: ResolvedProductCardPlugin;
  cart: {
    supportsManagerOrder: boolean;
  };
  slots: {
    Browser?: React.ComponentType<BrowserSlotProps>;
    CartCardAction?: React.ComponentType<CartCardActionSlotProps>;
  };
}
