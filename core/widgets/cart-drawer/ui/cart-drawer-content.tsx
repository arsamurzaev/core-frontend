"use client";

import type { CartItemView } from "@/core/modules/cart";
import { resolveCartDrawerContentState } from "@/core/widgets/cart-drawer/model/cart-drawer-content-state";
import { CartCardList } from "@/core/widgets/cart-drawer/ui/cart-card-list";
import { CartDrawerCommentSection } from "@/core/widgets/cart-drawer/ui/cart-drawer-comment-section";
import { CartDrawerContentSkeleton } from "@/core/widgets/cart-drawer/ui/cart-drawer-content-skeleton";
import { CartDrawerEmptyState } from "@/core/widgets/cart-drawer/ui/cart-drawer-empty-state";
import { CartDrawerReadonlyCheckout } from "@/core/widgets/cart-drawer/ui/cart-drawer-readonly-checkout";
import { CartDrawerStatusMessage } from "@/core/widgets/cart-drawer/ui/cart-drawer-status-message";
import type {
  CheckoutConfig,
  CheckoutData,
  CheckoutLocation,
  CheckoutMethod,
} from "@/shared/lib/checkout-methods";
import type { CatalogPriceFormatMode } from "@/shared/lib/price-format";
import React from "react";

interface CartDrawerContentProps {
  comment: string;
  commentPlaceholder: string;
  checkoutConfig: CheckoutConfig;
  checkoutData: CheckoutData;
  checkoutError?: string | null;
  isCheckoutEnabled: boolean;
  checkoutLocked?: boolean;
  checkoutLocation: CheckoutLocation;
  checkoutMethod: CheckoutMethod | null;
  isLoading?: boolean;
  isManagedPublicCart: boolean;
  isCommentLocked?: boolean;
  isPublicMode: boolean;
  items: CartItemView[];
  integrationCheckoutElement?: React.ReactNode;
  actionRenderer?: (productId: string, item?: CartItemView) => React.ReactNode;
  onCommentChange: (comment: string) => void;
  onCheckoutChange: (method: CheckoutMethod, data: CheckoutData) => void;
  onExitPublicCart?: () => void;
  onItemClick: (item: CartItemView) => void;
  priceFormatMode: CatalogPriceFormatMode;
  status: string | null;
  statusMessage: string | null;
}

export const CartDrawerContent: React.FC<CartDrawerContentProps> = ({
  comment,
  commentPlaceholder,
  checkoutConfig,
  checkoutData,
  checkoutError,
  isCheckoutEnabled,
  checkoutLocked = false,
  checkoutLocation,
  checkoutMethod,
  isLoading = false,
  isManagedPublicCart,
  isCommentLocked = false,
  isPublicMode,
  items,
  integrationCheckoutElement,
  actionRenderer,
  onCommentChange,
  onCheckoutChange,
  onExitPublicCart,
  onItemClick,
  priceFormatMode,
  status,
  statusMessage,
}) => {
  const state = resolveCartDrawerContentState({
    checkoutConfig,
    isCheckoutEnabled,
    checkoutMethod,
    comment,
    isCommentLocked,
    isManagedPublicCart,
    itemsCount: items.length,
    status,
    statusMessage,
  });

  return (
    <div className="my-2 space-y-6 overflow-y-auto px-2 py-2">
      {state.shouldShowStatusMessage ? (
        <CartDrawerStatusMessage message={statusMessage ?? ""} />
      ) : null}

      {isLoading ? (
        <CartDrawerContentSkeleton />
      ) : state.hasItems ? (
        <CartCardList
          items={items}
          priceFormatMode={priceFormatMode}
          actionRenderer={actionRenderer}
          onItemClick={(item) => {
            if (item.product) {
              onItemClick(item);
            }
          }}
        />
      ) : (
        <CartDrawerEmptyState
          isPublicMode={isPublicMode}
          onExitPublicCart={onExitPublicCart}
        />
      )}

      {!isLoading && state.hasItems && state.shouldShowCommentEditor ? (
        <CartDrawerCommentSection
          checkoutConfig={checkoutConfig}
          checkoutData={checkoutData}
          checkoutError={checkoutError}
          checkoutLocked={checkoutLocked}
          checkoutLocation={checkoutLocation}
          checkoutMethod={checkoutMethod}
          comment={comment}
          commentPlaceholder={commentPlaceholder}
          disabled={isManagedPublicCart || isPublicMode}
          hasCheckoutMethods={state.hasCheckoutMethods}
          integrationCheckoutElement={integrationCheckoutElement}
          onCheckoutChange={onCheckoutChange}
          onCommentChange={onCommentChange}
        />
      ) : null}

      {!isLoading && state.hasItems && state.shouldShowReadonlySection ? (
        <CartDrawerReadonlyCheckout
          checkoutConfig={checkoutConfig}
          checkoutData={checkoutData}
          checkoutLocation={checkoutLocation}
          checkoutMethod={state.hasCheckoutMethods ? checkoutMethod : null}
          normalizedComment={state.normalizedComment}
          onCheckoutChange={onCheckoutChange}
          shouldShowReadonlyComment={state.shouldShowReadonlyComment}
        />
      ) : null}
    </div>
  );
};
