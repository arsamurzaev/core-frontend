"use client";

import type {
  CartSharePayload,
  PrepareShareOrderInput,
} from "@/core/modules/cart";
import React from "react";
import { toast } from "sonner";

interface UseCartDrawerShareParams {
  hasSharedCart: boolean;
  onShareClick: (input?: PrepareShareOrderInput) => Promise<CartSharePayload>;
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

  const handleShare = React.useCallback(async (input?: PrepareShareOrderInput) => {
    try {
      const nextPayload = await onShareClick(input);
      setSharePayload(nextPayload);
      setHasOpenedShareDrawer(true);
      onSharePrepared?.();
      setIsShareDrawerOpen(true);
      return true;
    } catch (error) {
      toast.error(getShareErrorMessage(error));
      return false;
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
