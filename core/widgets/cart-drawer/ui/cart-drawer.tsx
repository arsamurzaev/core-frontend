"use client";

import { useCart } from "@/core/modules/cart/model/cart-context";
import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import { CART_DRAWER_SNAP_POINTS } from "@/core/widgets/cart-drawer/model/cart-drawer-state";
import { useCartDrawerSnap } from "@/core/widgets/cart-drawer/model/use-cart-drawer-snap";
import { CartDrawerContent } from "@/core/widgets/cart-drawer/ui/cart-drawer-content";
import { CartDrawerFooter } from "@/core/widgets/cart-drawer/ui/cart-drawer-footer";
import { CartDrawerHeader } from "@/core/widgets/cart-drawer/ui/cart-drawer-header";
import { CartDrawerManagerOrderStartBar } from "@/core/widgets/cart-drawer/ui/cart-drawer-manager-order-start-bar";
import { CartDrawerProductPreview } from "@/core/widgets/cart-drawer/ui/cart-drawer-product-preview";
import { resolveCartDrawerVisibility } from "@/core/widgets/cart-drawer/model/cart-drawer-state";
import { useCartDrawerCheckout } from "@/core/widgets/cart-drawer/model/use-cart-drawer-checkout";
import { useCartDrawerCompleteOrder } from "@/core/widgets/cart-drawer/model/use-cart-drawer-complete-order";
import { useCartDrawerHeaderAction } from "@/core/widgets/cart-drawer/model/use-cart-drawer-header-action";
import { useCartDrawerProductPreview } from "@/core/widgets/cart-drawer/model/use-cart-drawer-product-preview";
import {
  getCatalogCheckoutConfig,
  getCatalogCheckoutLocation,
  type CheckoutConfig,
} from "@/shared/lib/checkout-methods";
import { cn, getCatalogCurrency } from "@/shared/lib/utils";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { useDrawerCoordinator } from "@/shared/providers/drawer-coordinator-provider";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { usePathname } from "next/navigation";
import React from "react";

const DEFAULT_COMMENT_PLACEHOLDER =
  "Укажите пожелания к заказу: характеристики, замену, упаковку, доставку или другие важные детали.";

interface CartDrawerProps {
  actionRenderer?: (
    productId: string,
    item?: CartItemView,
  ) => React.ReactNode;
  checkoutConfig?: CheckoutConfig;
  commentPlaceholder?: string;
  supportsBrands?: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  actionRenderer,
  checkoutConfig: checkoutConfigProp,
  commentPlaceholder = DEFAULT_COMMENT_PLACEHOLDER,
  supportsBrands = true,
}) => {
  const {
    autoExpandPublicCartAccessKey,
    canCreateManagerOrder,
    canShare,
    cart,
    catalogMode,
    completeManagedOrder,
    deleteCurrentCart,
    detachPublicCart,
    isBusy,
    isLoading,
    isManagerOrderCart,
    isManagedPublicCart,
    isPublicMode,
    items,
    prepareShareOrder,
    publicAccess,
    startManagerOrder,
    status,
    statusMessage,
    shouldUseCartUi,
    totals,
  } = useCart();
  const { hasBlockingDrawer } = useDrawerCoordinator();
  const catalog = useCatalog();
  const pathname = usePathname();
  const checkoutConfig = React.useMemo(
    () => checkoutConfigProp ?? getCatalogCheckoutConfig(catalog),
    [catalog, checkoutConfigProp],
  );
  const checkoutLocation = React.useMemo(
    () => getCatalogCheckoutLocation(catalog),
    [catalog],
  );
  const currency = items[0]?.currency ?? getCatalogCurrency(catalog, "RUB");
  const {
    handleProductDrawerAfterClose,
    handleProductDrawerOpenChange,
    isProductDrawerOpen,
    openProduct,
    selectedCartItem,
    selectedProduct,
  } = useCartDrawerProductPreview();

  const hasItems = items.length > 0;
  const isCheckoutEnabled = catalogMode === "DELIVERY";
  const shouldHideCartWhileProductRouteOpen =
    pathname?.startsWith("/product/") ?? false;
  const publicAccessPublicKey = publicAccess?.publicKey ?? null;
  const hasSharedCart = Boolean(publicAccessPublicKey);
  const {
    buildOrderInput,
    checkoutValidation,
    displayedCheckoutData,
    displayedCheckoutMethod,
    displayedComment,
    handleCheckoutChange,
    hasPreparedShareOrder,
    isCheckoutLocked,
    isCommentLocked,
    markSharePrepared,
    setComment,
  } = useCartDrawerCheckout({
    cart,
    checkoutConfig,
    checkoutLocation,
    hasSharedCart,
    isCheckoutEnabled,
    isManagedPublicCart,
    isPublicMode,
  });
  const {
    canDeleteCurrentCart,
    shouldHideDrawer,
    shouldShowManagerOrderStartBar,
  } = React.useMemo(
    () =>
      resolveCartDrawerVisibility({
        canCreateManagerOrder,
        cart,
        hasItems,
        hasPreparedShareOrder,
        isPublicMode,
        publicAccessPublicKey,
        shouldUseCartUi,
        status,
      }),
    [
      canCreateManagerOrder,
      cart,
      hasItems,
      hasPreparedShareOrder,
      isPublicMode,
      publicAccessPublicKey,
      shouldUseCartUi,
      status,
    ],
  );
  const shouldSuspendManagerCartDrawer =
    hasBlockingDrawer && isManagerOrderCart;
  const { isFullyExpanded, setSnapPoint, snapPoint } = useCartDrawerSnap({
    autoExpandPublicCartAccessKey,
    isPublicMode,
    publicAccessPublicKey,
    shouldHideCartWhileProductRouteOpen,
    shouldHideDrawer,
  });

  const handleHeaderAction = useCartDrawerHeaderAction({
    canDeleteCurrentCart,
    cart,
    deleteCurrentCart,
    detachPublicCart,
    hasItems,
    isManagedPublicCart,
    isPublicMode,
    setSnapPoint,
  });

  const handleCompleteOrder = useCartDrawerCompleteOrder({
    buildOrderInput,
    checkoutValidationError: checkoutValidation.error,
    completeManagedOrder,
    isCheckoutLocked,
  });

  if (shouldHideDrawer || shouldSuspendManagerCartDrawer) {
    if (shouldShowManagerOrderStartBar) {
      return (
        <CartDrawerManagerOrderStartBar
          disabled={isBusy}
          onStart={startManagerOrder}
        />
      );
    }

    return null;
  }

  return (
    <>
      {!shouldHideCartWhileProductRouteOpen ? (
        <AppDrawer
          open
          handleOnly
          modal={false}
          noBodyStyles
          onClose={() => setSnapPoint(1)}
          snapPoints={CART_DRAWER_SNAP_POINTS as unknown as (string | number)[]}
          activeSnapPoint={snapPoint}
          setActiveSnapPoint={setSnapPoint}
          snapToSequentialPoint
        >
          <AppDrawer.Content
            hideOverlay
            handleWrapperClassName="pt-0"
            handleClassName="mx-auto mt-2 h-1 w-[50px] rounded-full bg-muted"
            className={cn(
              "shadow-custom bg-background fixed inset-x-0 bottom-0 z-30 mx-auto mt-24 flex h-full max-h-[94%] max-w-180 flex-col rounded-t-2xl border pb-0 focus:outline-none",
              "max-h-[calc(100%-25px)] w-[98%] transition-all",
              snapPoint === 1 && "w-full",
            )}
          >
            <CartDrawerHeader
              currency={currency}
              hasAction={
                !isManagedPublicCart && (isPublicMode || canDeleteCurrentCart)
              }
              hasDiscount={totals.hasDiscount}
              onActionClick={() => void handleHeaderAction()}
              price={totals.subtotal}
              setSnapPoint={setSnapPoint}
              snapPoint={snapPoint}
              totalPrice={totals.originalSubtotal}
              totalQuantity={totals.itemsCount}
            />

            <DrawerScrollArea>
              <CartDrawerContent
                comment={displayedComment}
                commentPlaceholder={commentPlaceholder}
                checkoutConfig={checkoutConfig}
                checkoutData={displayedCheckoutData}
                checkoutError={checkoutValidation.error}
                isCheckoutEnabled={isCheckoutEnabled}
                checkoutLocked={isCheckoutLocked}
                checkoutLocation={checkoutLocation}
                checkoutMethod={displayedCheckoutMethod}
                isLoading={isLoading}
                isManagedPublicCart={isManagedPublicCart}
                isCommentLocked={isCommentLocked}
                isPublicMode={isPublicMode}
                items={items}
                actionRenderer={actionRenderer}
                onCommentChange={setComment}
                onCheckoutChange={handleCheckoutChange}
                onItemClick={openProduct}
                status={status}
                statusMessage={statusMessage}
              />
            </DrawerScrollArea>

            <CartDrawerFooter
              canShare={canShare}
              currency={currency}
              hasDiscount={totals.hasDiscount}
              hasSharedCart={hasSharedCart}
              hasItems={hasItems}
              isBusy={isBusy}
              isManagerOrderCart={isManagerOrderCart}
              isShareDisabled={!isCheckoutLocked && Boolean(checkoutValidation.error)}
              onCollapse={
                !canShare && !isManagedPublicCart && isFullyExpanded
                  ? () => setSnapPoint(CART_DRAWER_SNAP_POINTS[0])
                  : undefined
              }
              onCompleteOrder={handleCompleteOrder}
              onSharePrepared={markSharePrepared}
              onShareClick={() => prepareShareOrder(buildOrderInput())}
              price={totals.subtotal}
              totalPrice={totals.originalSubtotal}
            />
          </AppDrawer.Content>
        </AppDrawer>
      ) : null}

      <CartDrawerProductPreview
        isOpen={isProductDrawerOpen}
        selectedCartItem={selectedCartItem}
        selectedProduct={selectedProduct}
        supportsBrands={supportsBrands}
        onOpenChange={handleProductDrawerOpenChange}
        onAfterClose={handleProductDrawerAfterClose}
      />
    </>
  );
};
