"use client";

import { useCart } from "@/core/modules/cart/model/cart-context";
import type { CartItemView } from "@/core/modules/cart/model/cart-item-view";
import {
  CART_DRAWER_SNAP_POINTS,
  isCheckoutCartStatus,
} from "@/core/widgets/cart-drawer/model/cart-drawer-state";
import { useCartDrawerSnap } from "@/core/widgets/cart-drawer/model/use-cart-drawer-snap";
import { CartDrawerContent } from "@/core/widgets/cart-drawer/ui/cart-drawer-content";
import { CartDrawerFooter } from "@/core/widgets/cart-drawer/ui/cart-drawer-footer";
import { CartDrawerHeader } from "@/core/widgets/cart-drawer/ui/cart-drawer-header";
import { CartDrawerManagerOrderStartBar } from "@/core/widgets/cart-drawer/ui/cart-drawer-manager-order-start-bar";
import { CartDrawerProductPreview } from "@/core/widgets/cart-drawer/ui/cart-drawer-product-preview";
import { resolveCartDrawerFooterAction } from "@/core/widgets/cart-drawer/model/cart-drawer-footer-state";
import {
  buildIntegrationCheckoutOrderInput,
  getInitialIntegrationCheckoutMethod,
  getSelectableIntegrationCheckoutMethods,
  hasIikoCartItems,
  resolveEffectiveIntegrationCheckoutFields,
  resolveIntegrationCheckoutFields,
  validateIntegrationCheckout,
  validateIntegrationPolicyConsent,
} from "@/core/widgets/cart-drawer/model/integration-checkout";
import { resolveCartDrawerVisibility } from "@/core/widgets/cart-drawer/model/cart-drawer-state";
import { resolveCartDrawerHeaderAction } from "@/core/widgets/cart-drawer/model/cart-drawer-header-action";
import { useCartDrawerCheckout } from "@/core/widgets/cart-drawer/model/use-cart-drawer-checkout";
import { useCartDrawerCompleteOrder } from "@/core/widgets/cart-drawer/model/use-cart-drawer-complete-order";
import { useCartDrawerHeaderAction } from "@/core/widgets/cart-drawer/model/use-cart-drawer-header-action";
import { useCartDrawerProductPreview } from "@/core/widgets/cart-drawer/model/use-cart-drawer-product-preview";
import { IntegrationCheckoutSection } from "@/core/widgets/cart-drawer/ui/integration-checkout-section";
import {
  getCatalogCheckoutConfig,
  getCatalogCheckoutLocation,
  type CheckoutData,
  type CheckoutConfig,
  type CheckoutMethod,
} from "@/shared/lib/checkout-methods";
import {
  buildHallTableCheckoutData,
  useHallTableContext,
} from "@/shared/lib/hall-table";
import { getCatalogPriceFormatMode } from "@/shared/lib/price-format";
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
  actionRenderer?: (productId: string, item?: CartItemView) => React.ReactNode;
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
    hallTableSession,
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
  const hallTable = useHallTableContext();
  const pathname = usePathname();
  const checkoutConfig = React.useMemo(
    () => checkoutConfigProp ?? getCatalogCheckoutConfig(catalog),
    [catalog, checkoutConfigProp],
  );
  const checkoutLocation = React.useMemo(
    () => getCatalogCheckoutLocation(catalog),
    [catalog],
  );
  const priceFormatMode = getCatalogPriceFormatMode(catalog);
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
  const cartPublicKey =
    (cart as { publicKey?: string | null } | null | undefined)?.publicKey ??
    null;
  const hasSharedCart = Boolean(
    publicAccessPublicKey || cartPublicKey || isCheckoutCartStatus(status),
  );
  const isHallTablePublicCart = Boolean(
    publicAccess?.kind === "hallTable" || cart?.tableSession,
  );
  const isManagedHallTableCart = isManagedPublicCart && isHallTablePublicCart;
  const currentGuestSessionId =
    hallTableSession.guestSessionId ?? publicAccess?.guestSessionId ?? null;
  const shouldShowCheckoutInCart = isCheckoutEnabled && !isManagedHallTableCart;
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
    isCheckoutEnabled: shouldShowCheckoutInCart,
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
        isHallTablePublicCart,
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
      isHallTablePublicCart,
      isPublicMode,
      publicAccessPublicKey,
      shouldUseCartUi,
      status,
    ],
  );
  const shouldSuspendManagerCartDrawer =
    hasBlockingDrawer && isManagerOrderCart;
  const isGuestPublicCart = Boolean(
    isPublicMode && isHallTablePublicCart && !isManagedPublicCart,
  );
  const hasCurrentGuestItems = currentGuestSessionId
    ? items.some((item) => item.guestSessionId === currentGuestSessionId)
    : false;
  const hasHeaderActionItems = isGuestPublicCart
    ? hasCurrentGuestItems
    : hasItems;
  const headerActionKind = React.useMemo(
    () =>
      resolveCartDrawerHeaderAction({
        canDeleteCurrentCart,
        hasItems: hasHeaderActionItems,
        isGuestPublicCart,
        isManagedPublicCart,
        isPublicMode,
      }),
    [
      canDeleteCurrentCart,
      hasHeaderActionItems,
      isGuestPublicCart,
      isManagedPublicCart,
      isPublicMode,
    ],
  );
  const canExitEmptyPublicCart = Boolean(
    !hasItems &&
    (isManagedPublicCart || (isPublicMode && !isHallTablePublicCart)),
  );
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
    hasItems: hasHeaderActionItems,
    isGuestPublicCart,
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
  const orderInput = React.useMemo(() => {
    const input = buildOrderInput();
    if (catalogMode !== "HALL") return input;

    return {
      ...input,
      checkoutMethod: "PICKUP" as const,
      checkoutData: {
        ...(input.checkoutData ?? {}),
        ...buildHallTableCheckoutData(hallTable),
      },
    };
  }, [buildOrderInput, catalogMode, hallTable]);
  const hasIikoIntegrationItems = React.useMemo(
    () => hasIikoCartItems(items),
    [items],
  );
  const canCollapseDrawer = !canShare && !isManagedPublicCart && isFullyExpanded;
  const footerAction = React.useMemo(
    () =>
      resolveCartDrawerFooterAction({
        canShare,
        hasCollapseAction: canCollapseDrawer,
        isManagerOrderCart,
      }),
    [canCollapseDrawer, canShare, isManagerOrderCart],
  );
  const selectableIntegrationCheckoutMethods = React.useMemo(
    () => getSelectableIntegrationCheckoutMethods(checkoutConfig.availableMethods),
    [checkoutConfig.availableMethods],
  );
  const initialIntegrationCheckoutMethod = React.useMemo(
    () =>
      getInitialIntegrationCheckoutMethod({
        availableMethods: selectableIntegrationCheckoutMethods,
        orderInput,
      }),
    [orderInput, selectableIntegrationCheckoutMethods],
  );
  const [integrationCheckoutMethod, setIntegrationCheckoutMethod] =
    React.useState<CheckoutMethod>(initialIntegrationCheckoutMethod);
  const [integrationCheckoutData, setIntegrationCheckoutData] =
    React.useState<CheckoutData>({});
  const [isIntegrationPolicyAccepted, setIsIntegrationPolicyAccepted] =
    React.useState(false);
  const cartId = cart?.id ?? null;
  const previousIntegrationCartId = React.useRef(cartId);

  React.useEffect(() => {
    if (previousIntegrationCartId.current === cartId) {
      return;
    }

    previousIntegrationCartId.current = cartId;
    setIntegrationCheckoutData({});
    setIntegrationCheckoutMethod(initialIntegrationCheckoutMethod);
    setIsIntegrationPolicyAccepted(false);
  }, [cartId, initialIntegrationCheckoutMethod]);

  React.useEffect(() => {
    setIntegrationCheckoutMethod((current) =>
      selectableIntegrationCheckoutMethods.includes(current)
        ? current
        : initialIntegrationCheckoutMethod,
    );
  }, [initialIntegrationCheckoutMethod, selectableIntegrationCheckoutMethods]);

  const effectiveIntegrationCheckoutMethod =
    orderInput.checkoutMethod ?? integrationCheckoutMethod;
  const shouldShowIntegrationCheckout = Boolean(
    hasItems &&
      hasIikoIntegrationItems &&
      !isManagedHallTableCart &&
      (footerAction === "complete-order" ||
        (footerAction === "share" && !hasSharedCart)),
  );
  const integrationCheckoutFields = React.useMemo(
    () => {
      if (!shouldShowIntegrationCheckout) {
        return [];
      }

      const fields = resolveIntegrationCheckoutFields({
        catalogMode,
        hasIikoItems: true,
        orderInput,
        requirePreorderTable: footerAction === "complete-order",
      });

      if (!shouldShowCheckoutInCart) {
        return fields;
      }

      return fields.filter(
        (field) =>
          field !== "address" &&
          field !== "checkoutMethod" &&
          field !== "personsCount",
      );
    },
    [
      catalogMode,
      footerAction,
      orderInput,
      shouldShowCheckoutInCart,
      shouldShowIntegrationCheckout,
    ],
  );
  const mergedIntegrationCheckoutData = React.useMemo(
    () => ({
      ...(orderInput.checkoutData ?? {}),
      ...integrationCheckoutData,
    }),
    [integrationCheckoutData, orderInput.checkoutData],
  );
  const effectiveIntegrationCheckoutFields = React.useMemo(
    () =>
      resolveEffectiveIntegrationCheckoutFields({
        fields: integrationCheckoutFields,
        method: effectiveIntegrationCheckoutMethod,
      }),
    [effectiveIntegrationCheckoutMethod, integrationCheckoutFields],
  );
  const integrationCheckoutValidationError = React.useMemo(
    () =>
      shouldShowIntegrationCheckout
        ? validateIntegrationCheckout({
            data: mergedIntegrationCheckoutData,
            fields: effectiveIntegrationCheckoutFields,
            method: effectiveIntegrationCheckoutMethod,
          })
        : null,
    [
      effectiveIntegrationCheckoutFields,
      effectiveIntegrationCheckoutMethod,
      mergedIntegrationCheckoutData,
      shouldShowIntegrationCheckout,
    ],
  );
  const integrationPolicyError = shouldShowIntegrationCheckout
    ? validateIntegrationPolicyConsent(isIntegrationPolicyAccepted)
    : null;
  const integrationCheckoutError =
    integrationCheckoutValidationError ?? integrationPolicyError;
  const orderInputWithIntegrationCheckout = React.useMemo(
    () =>
      shouldShowIntegrationCheckout
        ? buildIntegrationCheckoutOrderInput({
            baseInput: orderInput,
            data: integrationCheckoutData,
            location: checkoutLocation,
            method: effectiveIntegrationCheckoutMethod,
          })
        : orderInput,
    [
      checkoutLocation,
      effectiveIntegrationCheckoutMethod,
      integrationCheckoutData,
      orderInput,
      shouldShowIntegrationCheckout,
    ],
  );
  const integrationCheckoutElement = shouldShowIntegrationCheckout ? (
    <IntegrationCheckoutSection
      availableMethods={selectableIntegrationCheckoutMethods}
      checkoutData={mergedIntegrationCheckoutData}
      disabled={isBusy}
      fields={integrationCheckoutFields}
      method={effectiveIntegrationCheckoutMethod}
      onDataChange={setIntegrationCheckoutData}
      onMethodChange={setIntegrationCheckoutMethod}
      onPolicyAcceptedChange={setIsIntegrationPolicyAccepted}
      policyAccepted={isIntegrationPolicyAccepted}
    />
  ) : null;
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
          dismissible={false}
          handleOnly
          modal={false}
          noBodyStyles
          onClose={() => setSnapPoint(CART_DRAWER_SNAP_POINTS[0])}
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
              collapsedSnapPoint={CART_DRAWER_SNAP_POINTS[0]}
              actionKind={headerActionKind}
              hasAction={headerActionKind !== "none"}
              hasDiscount={totals.hasDiscount}
              onActionClick={() => void handleHeaderAction()}
              price={totals.subtotal}
              priceFormatMode={priceFormatMode}
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
                isCheckoutEnabled={shouldShowCheckoutInCart}
                checkoutLocked={isCheckoutLocked}
                checkoutLocation={checkoutLocation}
                checkoutMethod={displayedCheckoutMethod}
                isLoading={isLoading}
                isManagedPublicCart={isManagedPublicCart}
                isCommentLocked={isCommentLocked}
                isPublicMode={isPublicMode}
                items={items}
                integrationCheckoutElement={integrationCheckoutElement}
                priceFormatMode={priceFormatMode}
                actionRenderer={actionRenderer}
                onCommentChange={setComment}
                onCheckoutChange={handleCheckoutChange}
                onExitPublicCart={
                  canExitEmptyPublicCart
                    ? () => void handleHeaderAction()
                    : undefined
                }
                onItemClick={openProduct}
                status={status}
                statusMessage={statusMessage}
              />
            </DrawerScrollArea>

            <CartDrawerFooter
              canShare={canShare}
              completeOrderLabel={
                isManagedHallTableCart ? "Подтвердить" : undefined
              }
              currency={currency}
              hasDiscount={totals.hasDiscount}
              hasSharedCart={hasSharedCart}
              hasItems={hasItems}
              integrationCheckoutError={integrationCheckoutError}
              isBusy={isBusy}
              isManagerOrderCart={isManagerOrderCart}
              isShareDisabled={
                !isCheckoutLocked && Boolean(checkoutValidation.error)
              }
              onCollapse={
                canCollapseDrawer
                  ? () => setSnapPoint(CART_DRAWER_SNAP_POINTS[0])
                  : undefined
              }
              onCompleteOrder={handleCompleteOrder}
              onSharePrepared={markSharePrepared}
              onShareClick={(input) =>
                prepareShareOrder(input ?? orderInputWithIntegrationCheckout)
              }
              orderInput={orderInputWithIntegrationCheckout}
              price={totals.subtotal}
              priceFormatMode={priceFormatMode}
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
