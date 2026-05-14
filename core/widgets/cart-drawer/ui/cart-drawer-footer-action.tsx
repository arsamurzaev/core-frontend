"use client";

import {
  getCartDrawerShareButtonLabel,
  type CartDrawerFooterActionKind,
} from "@/core/widgets/cart-drawer/model/cart-drawer-footer-state";
import { Button } from "@/shared/ui/button";
import React from "react";

interface CartDrawerFooterActionProps {
  action: CartDrawerFooterActionKind;
  hasItems: boolean;
  hasOpenedShareDrawer: boolean;
  hasSharedCart: boolean;
  isBusy: boolean;
  isShareDisabled: boolean;
  onCollapse?: () => void;
  onComplete: () => void;
  onShare: () => void;
}

export const CartDrawerFooterAction: React.FC<CartDrawerFooterActionProps> = ({
  action,
  hasItems,
  hasOpenedShareDrawer,
  hasSharedCart,
  isBusy,
  isShareDisabled,
  onCollapse,
  onComplete,
  onShare,
}) => {
  if (action === "complete-order") {
    return (
      <Button
        type="button"
        className="w-full justify-center"
        disabled={isBusy}
        onClick={onComplete}
        size="full"
      >
        Завершить заказ
      </Button>
    );
  }

  if (action === "share") {
    return (
      <Button
        type="button"
        className="w-full justify-center"
        disabled={isBusy || !hasItems || isShareDisabled}
        onClick={onShare}
        size="full"
      >
        {getCartDrawerShareButtonLabel({
          hasOpenedShareDrawer,
          hasSharedCart,
        })}
      </Button>
    );
  }

  if (action === "collapse" && onCollapse) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center"
        onClick={onCollapse}
        size="full"
      >
        Свернуть
      </Button>
    );
  }

  return null;
};
