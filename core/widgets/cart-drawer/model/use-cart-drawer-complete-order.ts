"use client";

import type { PrepareShareOrderInput } from "@/core/modules/cart/model/cart-context.types";
import type { CompletedOrderDto } from "@/shared/api/generated/react-query";
import { confirm } from "@/shared/ui/confirmation";
import React from "react";
import { toast } from "sonner";

const COMPLETE_ORDER_CONFIRMATION = {
  title: "Завершить заказ?",
  description:
    "После подтверждения корзина будет переведена в завершенный заказ.",
  confirmText: "Завершить",
  cancelText: "Отмена",
};

const COMPLETE_ORDER_SUCCESS_MESSAGE = "Заказ завершен.";

interface UseCartDrawerCompleteOrderParams {
  buildOrderInput: () => PrepareShareOrderInput;
  checkoutValidationError: string | null;
  completeManagedOrder: (
    input?: PrepareShareOrderInput | string,
  ) => Promise<CompletedOrderDto>;
  isCheckoutLocked: boolean;
}

export function useCartDrawerCompleteOrder({
  buildOrderInput,
  checkoutValidationError,
  completeManagedOrder,
  isCheckoutLocked,
}: UseCartDrawerCompleteOrderParams) {
  return React.useCallback(async () => {
    const isConfirmed = await confirm(COMPLETE_ORDER_CONFIRMATION);

    if (!isConfirmed) {
      return;
    }

    if (!isCheckoutLocked && checkoutValidationError) {
      toast.error(checkoutValidationError);
      return;
    }

    await completeManagedOrder(buildOrderInput());
    toast.success(COMPLETE_ORDER_SUCCESS_MESSAGE);
  }, [
    buildOrderInput,
    checkoutValidationError,
    completeManagedOrder,
    isCheckoutLocked,
  ]);
}
