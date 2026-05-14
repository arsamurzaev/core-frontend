"use client";

import type { CartSharePayload } from "@/core/modules/cart/model/cart-context.types";
import { resolveCartDrawerFooterAction } from "@/core/widgets/cart-drawer/model/cart-drawer-footer-state";
import { useCartDrawerShare } from "@/core/widgets/cart-drawer/model/use-cart-drawer-share";
import { CartDrawerFooterAction } from "@/core/widgets/cart-drawer/ui/cart-drawer-footer-action";
import { CartDrawerFooterSummary } from "@/core/widgets/cart-drawer/ui/cart-drawer-footer-summary";
import { ShareDrawer } from "@/core/widgets/share-drawer/ui/share-drawer";
import type { CatalogContactDtoType } from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import { DrawerFooter } from "@/shared/ui/drawer";
import React from "react";
import { toast } from "sonner";

interface CartDrawerFooterProps {
  canShare: boolean;
  className?: string;
  currency: string;
  hasSharedCart?: boolean;
  hasDiscount: boolean;
  hasItems: boolean;
  isBusy?: boolean;
  isManagerOrderCart: boolean;
  isShareDisabled?: boolean;
  onCollapse?: () => void;
  onCompleteOrder: () => Promise<void>;
  onSharePrepared?: () => void;
  onShareClick: () => Promise<CartSharePayload>;
  price: number;
  totalPrice: number;
}

function getCompleteErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Не удалось завершить заказ.";
}

export const CartDrawerFooter: React.FC<CartDrawerFooterProps> = ({
  canShare,
  className,
  currency,
  hasSharedCart = false,
  hasDiscount,
  hasItems,
  isBusy = false,
  isManagerOrderCart,
  isShareDisabled = false,
  onCollapse,
  onCompleteOrder,
  onSharePrepared,
  onShareClick,
  price,
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

  const handleComplete = React.useCallback(async () => {
    try {
      await onCompleteOrder();
    } catch (error) {
      toast.error(getCompleteErrorMessage(error));
    }
  }, [onCompleteOrder]);

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
            totalPrice={totalPrice}
          />

          <CartDrawerFooterAction
            action={action}
            hasItems={hasItems}
            hasOpenedShareDrawer={share.hasOpenedShareDrawer}
            hasSharedCart={hasSharedCart}
            isBusy={isBusy}
            isShareDisabled={isShareDisabled}
            onCollapse={onCollapse}
            onComplete={() => void handleComplete()}
            onShare={() => void share.handleShare()}
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
