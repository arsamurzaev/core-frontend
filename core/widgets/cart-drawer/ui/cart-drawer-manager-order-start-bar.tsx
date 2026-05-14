"use client";

import { Button } from "@/shared/ui/button";
import React from "react";
import { toast } from "sonner";

interface CartDrawerManagerOrderStartBarProps {
  disabled: boolean;
  onStart: () => Promise<void>;
}

function getStartOrderErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Не удалось обновить корзину.";
}

export const CartDrawerManagerOrderStartBar: React.FC<
  CartDrawerManagerOrderStartBarProps
> = ({ disabled, onStart }) => {
  const handleStart = React.useCallback(async () => {
    try {
      await onStart();
      toast.success("Корзина создана. Теперь можно добавлять товары.");
    } catch (error) {
      toast.error(getStartOrderErrorMessage(error));
    }
  }, [onStart]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-180 px-2">
      <div className="shadow-custom rounded-t-2xl border bg-background px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <Button
          type="button"
          className="w-full justify-center"
          disabled={disabled}
          onClick={() => void handleStart()}
          size="full"
        >
          + Создать заказ
        </Button>
      </div>
    </div>
  );
};
