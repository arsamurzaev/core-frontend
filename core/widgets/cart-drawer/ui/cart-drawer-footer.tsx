"use client";

import type {
  CartSharePayload,
  PrepareShareOrderInput,
} from "@/core/modules/cart/model/cart-context.types";
import { resolveCartDrawerFooterAction } from "@/core/widgets/cart-drawer/model/cart-drawer-footer-state";
import { resolveIntegrationCheckoutFields } from "@/core/widgets/cart-drawer/model/integration-checkout";
import { useCartDrawerShare } from "@/core/widgets/cart-drawer/model/use-cart-drawer-share";
import { CartDrawerFooterAction } from "@/core/widgets/cart-drawer/ui/cart-drawer-footer-action";
import { CartDrawerFooterSummary } from "@/core/widgets/cart-drawer/ui/cart-drawer-footer-summary";
import { IntegrationCheckoutDrawer } from "@/core/widgets/cart-drawer/ui/integration-checkout-drawer";
import { ShareDrawer } from "@/core/widgets/share-drawer/ui/share-drawer";
import type { CatalogContactDtoType } from "@/shared/api/generated/react-query";
import type {
  CheckoutConfig,
  CheckoutLocation,
} from "@/shared/lib/checkout-methods";
import type { CatalogPriceFormatMode } from "@/shared/lib/price-format";
import { cn } from "@/shared/lib/utils";
import { DrawerFooter } from "@/shared/ui/drawer";
import React from "react";
import { toast } from "sonner";

interface CartDrawerFooterProps {
  canShare: boolean;
  checkoutConfig: CheckoutConfig;
  checkoutLocation: CheckoutLocation;
  className?: string;
  currency: string;
  completeOrderLabel?: string;
  hasSharedCart?: boolean;
  hasDiscount: boolean;
  hasItems: boolean;
  hasIikoCartItems: boolean;
  isBusy?: boolean;
  isManagerOrderCart: boolean;
  skipIntegrationCheckout?: boolean;
  isShareDisabled?: boolean;
  onCollapse?: () => void;
  onCompleteOrder: (input?: PrepareShareOrderInput) => Promise<void>;
  onSharePrepared?: () => void;
  onShareClick: (input?: PrepareShareOrderInput) => Promise<CartSharePayload>;
  orderInput: PrepareShareOrderInput;
  price: number;
  priceFormatMode: CatalogPriceFormatMode;
  totalPrice: number;
}

function getCompleteErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Не удалось завершить заказ.";
}

export const CartDrawerFooter: React.FC<CartDrawerFooterProps> = ({
  canShare,
  checkoutConfig,
  checkoutLocation,
  className,
  currency,
  completeOrderLabel,
  hasSharedCart = false,
  hasDiscount,
  hasItems,
  hasIikoCartItems,
  isBusy = false,
  isManagerOrderCart,
  skipIntegrationCheckout = false,
  isShareDisabled = false,
  onCollapse,
  onCompleteOrder,
  onSharePrepared,
  onShareClick,
  orderInput,
  price,
  priceFormatMode,
  totalPrice,
}) => {
  const [isCheckoutDrawerOpen, setIsCheckoutDrawerOpen] = React.useState(false);
  const share = useCartDrawerShare({
    hasSharedCart,
    onShareClick,
    onSharePrepared,
  });
  const action = resolveCartDrawerFooterAction({
    canShare,
    hasCollapseAction: Boolean(onCollapse),
    isManagerOrderCart,
  });
  const integrationCheckoutFields = React.useMemo(
    () =>
      skipIntegrationCheckout
        ? []
        : resolveIntegrationCheckoutFields({
            hasIikoItems: hasIikoCartItems,
            orderInput,
            requirePreorderTable: action === "complete-order",
          }),
    [action, hasIikoCartItems, orderInput, skipIntegrationCheckout],
  );
  const shouldOpenCheckoutDrawer =
    (action === "share" || action === "complete-order") &&
    integrationCheckoutFields.length > 0 &&
    (action === "complete-order" ||
      (!hasSharedCart && !share.hasOpenedShareDrawer));

  const handleComplete = React.useCallback(
    async (input?: PrepareShareOrderInput) => {
      try {
        await onCompleteOrder(input);
        return true;
      } catch (error) {
        toast.error(getCompleteErrorMessage(error));
        return false;
      }
    },
    [onCompleteOrder],
  );

  const handleCompleteAction = React.useCallback(() => {
    if (shouldOpenCheckoutDrawer) {
      setIsCheckoutDrawerOpen(true);
      return;
    }

    void handleComplete();
  }, [handleComplete, shouldOpenCheckoutDrawer]);

  const handleShareAction = React.useCallback(() => {
    if (shouldOpenCheckoutDrawer) {
      setIsCheckoutDrawerOpen(true);
      return;
    }

    void share.handleShare(orderInput);
  }, [orderInput, share, shouldOpenCheckoutDrawer]);

  const handleCheckoutSubmit = React.useCallback(
    async (input?: PrepareShareOrderInput) => {
      if (action === "complete-order") {
        const ok = await handleComplete(input);
        if (ok) {
          setIsCheckoutDrawerOpen(false);
        }
        return;
      }

      const ok = await share.handleShare(input);
      if (ok) {
        setIsCheckoutDrawerOpen(false);
      }
    },
    [action, handleComplete, share],
  );

  return (
    <>
      <DrawerFooter
        className={cn("mt-auto items-center px-3 pb-0 pt-0", className)}
      >
        <div
          className={cn(
            "shadow-custom border-muted mx-auto grid w-full max-w-[95%] items-center gap-4 rounded-t-lg border p-5 sm:gap-6",
            action !== "none"
              ? "grid-cols-[minmax(110px,auto)_minmax(0,1fr)]"
              : "grid-cols-1",
          )}
        >
          <CartDrawerFooterSummary
            currency={currency}
            hasDiscount={hasDiscount}
            price={price}
            priceFormatMode={priceFormatMode}
            totalPrice={totalPrice}
          />

          <CartDrawerFooterAction
            action={action}
            hasItems={hasItems}
            hasOpenedShareDrawer={share.hasOpenedShareDrawer}
            hasSharedCart={hasSharedCart}
            isBusy={isBusy}
            isShareDisabled={shouldOpenCheckoutDrawer ? false : isShareDisabled}
            completeLabel={completeOrderLabel}
            onCollapse={onCollapse}
            onComplete={handleCompleteAction}
            onShare={handleShareAction}
          />
        </div>
      </DrawerFooter>

      <IntegrationCheckoutDrawer
        availableMethods={checkoutConfig.availableMethods}
        checkoutLocation={checkoutLocation}
        currency={currency}
        disabled={isBusy}
        fields={integrationCheckoutFields}
        hasDiscount={hasDiscount}
        isBusy={isBusy}
        onOpenChange={setIsCheckoutDrawerOpen}
        onSubmit={handleCheckoutSubmit}
        open={isCheckoutDrawerOpen}
        orderInput={orderInput}
        price={price}
        priceFormatMode={priceFormatMode}
        totalPrice={totalPrice}
      />

      <ShareDrawer
        mode="share"
        open={share.isShareDrawerOpen}
        onOpenChange={share.setIsShareDrawerOpen}
        trigger={null}
        drawerTitle="Поделиться заказом"
        copyButtonLabel="Скопировать текст заказа"
        copyMode="message"
        copySuccessMessage="Текст заказа скопирован."
        appendUrlToMessage={false}
        title={undefined}
        text={share.sharePayload?.text}
        url={share.sharePayload?.url}
        contactsOverride={
          share.sharePayload?.contactsOverride as
            | Partial<Record<CatalogContactDtoType, string>>
            | undefined
        }
      />
    </>
  );
};
