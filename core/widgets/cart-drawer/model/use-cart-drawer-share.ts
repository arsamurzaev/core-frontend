"use client";

import type { CartSharePayload } from "@/core/modules/cart/model/cart-context.types";
import React from "react";
import { toast } from "sonner";

interface UseCartDrawerShareParams {
  hasSharedCart: boolean;
  onShareClick: () => Promise<CartSharePayload>;
  onSharePrepared?: () => void;
}

function getShareErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Не удалось подготовить заказ для отправки.";
}

export function useCartDrawerShare({
  hasSharedCart,
  onShareClick,
  onSharePrepared,
}: UseCartDrawerShareParams) {
  const [isShareDrawerOpen, setIsShareDrawerOpen] = React.useState(false);
  const [hasOpenedShareDrawer, setHasOpenedShareDrawer] = React.useState(false);
  const [sharePayload, setSharePayload] =
    React.useState<CartSharePayload | null>(null);

  const handleShare = React.useCallback(async () => {
    try {
      const nextPayload = await onShareClick();
      setSharePayload(nextPayload);
      setHasOpenedShareDrawer(true);
      onSharePrepared?.();
      setIsShareDrawerOpen(true);
    } catch (error) {
      toast.error(getShareErrorMessage(error));
    }
  }, [onShareClick, onSharePrepared]);

  return {
    effectiveHasSharedCart: hasSharedCart || hasOpenedShareDrawer,
    handleShare,
    hasOpenedShareDrawer,
    isShareDrawerOpen,
    setIsShareDrawerOpen,
    sharePayload,
  };
}
