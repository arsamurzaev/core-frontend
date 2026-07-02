"use client";

import type {
  CartSharePayload,
  PrepareShareOrderInput,
} from "@/core/modules/cart";
import { resolveCartDrawerFooterAction } from "@/core/widgets/cart-drawer/model/cart-drawer-footer-state";
import { useCartDrawerShare } from "@/core/widgets/cart-drawer/model/use-cart-drawer-share";
import { CartDrawerFooterAction } from "@/core/widgets/cart-drawer/ui/cart-drawer-footer-action";
import { CartDrawerFooterSummary } from "@/core/widgets/cart-drawer/ui/cart-drawer-footer-summary";
import { ShareDrawer } from "@/core/widgets/share-drawer/ui/share-drawer";
import type { CatalogContactDtoType } from "@/shared/api/generated/react-query";
import type { CatalogPriceFormatMode } from "@/shared/lib/price-format";
import { cn } from "@/shared/lib/utils";
import { DrawerFooter } from "@/shared/ui/drawer";
import React from "react";
import { toast } from "sonner";

interface CartDrawerFooterProps {
  canShare: boolean;
  className?: string;
  currency: string;
  completeOrderLabel?: string;
  hasSharedCart?: boolean;
  hasDiscount: boolean;
  hasItems: boolean;
  integrationCheckoutError?: string | null;
  isBusy?: boolean;
  isManagerOrderCart: boolean;
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
  className,
  currency,
  completeOrderLabel,
  hasSharedCart = false,
  hasDiscount,
  hasItems,
  integrationCheckoutError = null,
  isBusy = false,
  isManagerOrderCart,
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
    if (integrationCheckoutError) {
      toast.error(integrationCheckoutError);
      return;
    }

    void handleComplete(orderInput);
  }, [handleComplete, integrationCheckoutError, orderInput]);

  const handleShareAction = React.useCallback(() => {
    if (integrationCheckoutError) {
      toast.error(integrationCheckoutError);
      return;
    }

    void share.handleShare(orderInput);
  }, [integrationCheckoutError, orderInput, share]);

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
            isShareDisabled={isShareDisabled}
            completeLabel={completeOrderLabel}
            onCollapse={onCollapse}
            onComplete={handleCompleteAction}
            onShare={handleShareAction}
          />
        </div>
      </DrawerFooter>

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
