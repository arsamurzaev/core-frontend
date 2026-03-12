"use client";

import React from "react";

type AsyncVoid = void | Promise<void>;

type CloseAnimationEvent =
  | React.AnimationEvent<HTMLDivElement>
  | React.TransitionEvent<HTMLDivElement>;

interface UseConfirmationDrawerParams {
  closeOnCancel: boolean;
  closeOnConfirm: boolean;
  defaultOpen?: boolean;
  onAfterClose?: () => void;
  onCancel?: () => AsyncVoid;
  onConfirm?: () => AsyncVoid;
  onError?: (error: unknown) => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  preventCloseWhilePending: boolean;
}

export function useConfirmationDrawer({
  closeOnCancel,
  closeOnConfirm,
  defaultOpen,
  onAfterClose,
  onCancel,
  onConfirm,
  onError,
  onOpenChange,
  open,
  preventCloseWhilePending,
}: UseConfirmationDrawerParams) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false);
  const [isPending, setIsPending] = React.useState(false);
  const isMountedRef = React.useRef(true);
  const afterCloseFiredRef = React.useRef(false);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const actualOpen = isControlled ? open : internalOpen;

  React.useEffect(() => {
    if (actualOpen) {
      afterCloseFiredRef.current = false;
    }
  }, [actualOpen]);

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalOpen(next);
      }

      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const closeDrawer = React.useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next && preventCloseWhilePending && isPending) {
        return;
      }

      setOpen(next);
    },
    [isPending, preventCloseWhilePending, setOpen],
  );

  const handleCancel = React.useCallback(async () => {
    if (preventCloseWhilePending && isPending) {
      return;
    }

    try {
      await onCancel?.();
      if (closeOnCancel) {
        closeDrawer();
      }
    } catch (error) {
      onError?.(error);
    }
  }, [
    closeDrawer,
    closeOnCancel,
    isPending,
    onCancel,
    onError,
    preventCloseWhilePending,
  ]);

  const handleConfirm = React.useCallback(async () => {
    if (isPending) {
      return;
    }

    if (!onConfirm) {
      if (closeOnConfirm) {
        closeDrawer();
      }
      return;
    }

    setIsPending(true);

    try {
      await onConfirm();
      if (closeOnConfirm) {
        closeDrawer();
      }
    } catch (error) {
      onError?.(error);
    } finally {
      if (isMountedRef.current) {
        setIsPending(false);
      }
    }
  }, [closeDrawer, closeOnConfirm, isPending, onConfirm, onError]);

  const handleCloseAnimationEnd = React.useCallback(
    (event: CloseAnimationEvent) => {
      if (event.target !== event.currentTarget || actualOpen) {
        return;
      }

      const state = event.currentTarget.getAttribute("data-state");
      if ((state && state !== "closed") || afterCloseFiredRef.current) {
        return;
      }

      afterCloseFiredRef.current = true;
      onAfterClose?.();
    },
    [actualOpen, onAfterClose],
  );

  return {
    actualOpen,
    handleCancel,
    handleCloseAnimationEnd,
    handleConfirm,
    handleOpenChange,
    isPending,
  };
}
