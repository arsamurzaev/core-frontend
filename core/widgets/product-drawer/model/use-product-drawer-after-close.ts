"use client";

import React from "react";

interface UseProductDrawerAfterCloseParams {
  open: boolean;
  onAfterClose?: () => void;
  resetKey: string;
}

export function useProductDrawerAfterClose({
  open,
  onAfterClose,
  resetKey,
}: UseProductDrawerAfterCloseParams) {
  const didOpenOnceRef = React.useRef(open);
  const didNotifyCloseRef = React.useRef(false);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    didOpenOnceRef.current = true;
    didNotifyCloseRef.current = false;
  }, [open, resetKey]);

  const emitAfterCloseOnce = React.useCallback(() => {
    if (!didOpenOnceRef.current || didNotifyCloseRef.current) {
      return;
    }

    didNotifyCloseRef.current = true;
    onAfterClose?.();
  }, [onAfterClose]);

  React.useEffect(() => {
    if (open || !onAfterClose) {
      return;
    }

    const fallbackTimer = window.setTimeout(() => {
      emitAfterCloseOnce();
    }, 700);

    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, [emitAfterCloseOnce, onAfterClose, open]);

  return React.useCallback(
    (
      event:
        | React.AnimationEvent<HTMLDivElement>
        | React.TransitionEvent<HTMLDivElement>,
    ) => {
      if (event.target !== event.currentTarget) {
        return;
      }

      if (open) {
        return;
      }

      if (event.currentTarget.getAttribute("data-state") !== "closed") {
        return;
      }

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          emitAfterCloseOnce();
        });
      });
    },
    [emitAfterCloseOnce, open],
  );
}
