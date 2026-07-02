import type { CartItemView } from "@/core/modules/cart";
import type { CategoryCardVariant } from "@/core/modules/category";
import type { CategoryDto } from "@/shared/api/generated/react-query";
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

export interface CatalogRuntimeSlots {
  Browser?: React.ComponentType<BrowserSlotProps>;
  CartCardAction?: React.ComponentType<CartCardActionSlotProps>;
}
