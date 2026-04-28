"use client";

import {
  type CartProductSnapshot,
  useCart,
  useCartProductQuantity,
} from "@/core/modules/cart/model/cart-context";
import { confirm } from "@/shared/ui/confirmation";
import React from "react";
import { toast } from "sonner";

function getCartErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Не удалось обновить корзину.";
}

export function useCartProductControls(
  productId: string,
  product?: CartProductSnapshot,
) {
  const { decrementProduct, incrementProduct, isBusy } = useCart();
  const quantity = useCartProductQuantity(productId);

  const handleIncrement = React.useCallback(async () => {
    try {
      await incrementProduct(productId, product);
    } catch (error) {
      toast.error(getCartErrorMessage(error));
    }
  }, [incrementProduct, product, productId]);

  const handleDecrement = React.useCallback(async () => {
    if (!quantity) {
      return;
    }

    if (quantity === 1) {
      const isConfirmed = await confirm({
        title: "Удалить товар из корзины?",
        description: "Товар будет удален из текущей корзины.",
        confirmText: "Удалить",
        cancelText: "Отмена",
      });

      if (!isConfirmed) {
        return;
      }
    }

    try {
      await decrementProduct(productId, product);
    } catch (error) {
      toast.error(getCartErrorMessage(error));
    }
  }, [decrementProduct, product, productId, quantity]);

  return {
    handleAdd: handleIncrement,
    handleDecrement,
    handleIncrement,
    isBusy,
    quantity,
  };
}
