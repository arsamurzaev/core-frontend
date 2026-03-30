"use client";

import { type CartSharePayload } from "@/core/modules/cart/model/cart-context";
import { ShareDrawer } from "@/core/widgets/share-drawer/ui/share-drawer";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { DrawerFooter } from "@/shared/ui/drawer";
import React from "react";
import { toast } from "sonner";

interface CartDrawerFooterProps {
  className?: string;
  currency: string;
  hasDiscount: boolean;
  hasItems: boolean;
  isBusy?: boolean;
  isManagedPublicCart: boolean;
  onCompleteOrder: () => Promise<void>;
  onShareClick: () => Promise<CartSharePayload>;
  price: number;
  totalPrice: number;
}

function formatPrice(value: number) {
  return Intl.NumberFormat("ru-RU").format(value);
}

function getShareErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Не удалось подготовить заказ для отправки.";
}

function getCompleteErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Не удалось завершить заказ.";
}

export const CartDrawerFooter: React.FC<CartDrawerFooterProps> = ({
  className,
  currency,
  hasDiscount,
  hasItems,
  isBusy = false,
  isManagedPublicCart,
  onCompleteOrder,
  onShareClick,
  price,
  totalPrice,
}) => {
  const [isShareDrawerOpen, setIsShareDrawerOpen] = React.useState(false);
  const [sharePayload, setSharePayload] = React.useState<CartSharePayload | null>(
    null,
  );

  const handleShare = React.useCallback(async () => {
    try {
      const nextPayload = await onShareClick();
      setSharePayload(nextPayload);
      setIsShareDrawerOpen(true);
    } catch (error) {
      toast.error(getShareErrorMessage(error));
    }
  }, [onShareClick]);

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
        <div className="shadow-custom border-muted mx-auto grid w-full max-w-[720px] grid-cols-[minmax(110px,auto)_minmax(0,1fr)] items-center gap-4 rounded-t-lg border p-5 sm:gap-6">
          <div className="min-w-[110px]">
            <h4 className="w-[110px] text-xs">Заказ на сумму</h4>
            <h4 className="text-lg font-bold whitespace-nowrap sm:text-xl">
              {formatPrice(price)} {currency}
            </h4>
            {hasDiscount ? (
              <p className="text-muted text-xs line-through">
                {formatPrice(totalPrice)} {currency}
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            className="w-full justify-center"
            disabled={isBusy || !hasItems}
            onClick={() =>
              void (isManagedPublicCart ? handleComplete() : handleShare())
            }
            size="full"
          >
            {isManagedPublicCart ? "Завершить заказ" : "Поделиться"}
          </Button>
        </div>
      </DrawerFooter>

      <ShareDrawer
        mode="share"
        open={isShareDrawerOpen}
        onOpenChange={setIsShareDrawerOpen}
        trigger={null}
        drawerTitle="Поделиться заказом"
        copyButtonLabel="Скопировать текст заказа"
        copyMode="message"
        copySuccessMessage="Текст заказа скопирован."
        appendUrlToMessage={false}
        title={undefined}
        text={sharePayload?.text}
        url={sharePayload?.url}
      />
    </>
  );
};
