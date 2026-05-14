import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import type { CartMode } from "@/core/modules/cart/model/cart-constants";
import type { CartLineSelection } from "@/core/modules/cart/model/cart-line-selection";
import type { CartPublicAccess } from "@/core/modules/cart/model/cart-public-link";
import type {
  CartDto,
  CompletedOrderDto,
  ProductWithAttributesDto,
} from "@/shared/api/generated/react-query";
import type { CatalogContactDtoType } from "@/shared/api/generated/react-query";
import type { CatalogExperienceMode } from "@/shared/lib/catalog-mode";
import type { CheckoutData, CheckoutMethod } from "@/shared/lib/checkout-methods";

export interface CartSharePayload {
  contactsOverride?: Partial<Record<CatalogContactDtoType, string>>;
  text: string;
  title?: string;
  url: string;
}

export type PrepareShareOrderInput = {
  checkoutData?: CheckoutData;
  checkoutMethod?: CheckoutMethod;
  checkoutSummary?: string[];
  comment?: string;
};

export interface CartContextValue {
  autoExpandPublicCartAccessKey: string | null;
  canCreateManagerOrder: boolean;
  cart: CartDto | null;
  catalogMode: CatalogExperienceMode;
  clearCart: () => Promise<void>;
  completeManagedOrder: (
    input?: PrepareShareOrderInput | string,
  ) => Promise<CompletedOrderDto>;
  deleteCurrentCart: () => Promise<void>;
  decrementLine: (
    selection: CartLineSelection,
    product?: CartProductSnapshot,
  ) => Promise<void>;
  decrementProduct: (
    productId: string,
    product?: CartProductSnapshot,
    variantId?: string,
    saleUnitId?: string,
  ) => Promise<void>;
  detachPublicCart: () => void;
  incrementLine: (
    selection: CartLineSelection,
    product?: CartProductSnapshot,
  ) => Promise<void>;
  incrementProduct: (
    productId: string,
    product?: CartProductSnapshot,
    variantId?: string,
    saleUnitId?: string,
  ) => Promise<void>;
  setProductQuantity: (
    productId: string,
    nextQuantity: number,
    product?: CartProductSnapshot,
    variantId?: string,
    saleUnitId?: string,
  ) => Promise<void>;
  setLineQuantity: (
    selection: CartLineSelection,
    nextQuantity: number,
    product?: CartProductSnapshot,
  ) => Promise<void>;
  isBusy: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  isManagerOrderCart: boolean;
  isManagedPublicCart: boolean;
  isOwnSharedCart: boolean;
  isPublicMode: boolean;
  items: CartItemView[];
  mode: CartMode;
  prepareShareOrder: (
    input?: PrepareShareOrderInput | string,
  ) => Promise<CartSharePayload>;
  publicAccess: CartPublicAccess | null;
  canShare: boolean;
  quantityByLineKey: Record<string, number>;
  quantityByProductId: Record<string, number>;
  shouldUseCartUi: boolean;
  startManagerOrder: () => Promise<void>;
  status: CartDto["status"] | null;
  statusMessage: string | null;
  totals: {
    hasDiscount: boolean;
    itemsCount: number;
    originalSubtotal: number;
    subtotal: number;
  };
}

export type CartProductSnapshot = Pick<
  ProductWithAttributesDto,
  "id" | "name" | "slug"
> & {
  price: number | string | null;
};

export type CartDtoWithCheckout = CartDto & {
  checkoutContacts?: Partial<Record<CatalogContactDtoType, string>> | null;
  checkoutData?: CheckoutData | null;
  checkoutMethod?: CheckoutMethod | null;
};

export type CartMutationContext = {
  previousCart: CartDto | null | undefined;
};
