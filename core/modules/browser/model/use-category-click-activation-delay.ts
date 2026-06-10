"use client";

import React from "react";
import { flushSync } from "react-dom";
import { scrollCategorySectionIntoView } from "./category-scroll";

interface UseCategoryClickActivationDelayParams {
  enabled?: boolean;
}

interface UseCategoryClickActivationDelayResult {
  activationBlockedCategoryId: string | null;
  forceActivatedCategoryId: string | null;
  handleCategoryClick: (category: { id: string }) => void;
}

const CATEGORY_CLICK_ACTIVATION_SETTLE_FRAMES = 3;
const CATEGORY_CLICK_LOCK_MS = 1_600;
const CATEGORY_CLICK_INSTANT_STABILIZATION_FRAMES = 10;
const CATEGORY_CLICK_INSTANT_STABILIZATION_DELAYS_MS = [120, 300, 700, 1_200];

export function useCategoryClickActivationDelay({
  enabled = true,
}: UseCategoryClickActivationDelayParams = {}): UseCategoryClickActivationDelayResult {
  const activationFrameRef = React.useRef<number | null>(null);
  const stabilizationFrameRef = React.useRef<number | null>(null);
  const releaseTimeoutRef = React.useRef<number | null>(null);
  const stabilizationTimeoutsRef = React.useRef<number[]>([]);
  const [activationBlockedCategoryId, setActivationBlockedCategoryId] =
    React.useState<string | null>(null);
  const [forceActivatedCategoryId, setForceActivatedCategoryId] =
    React.useState<string | null>(null);

  const cancelActivationFrame = React.useCallback(() => {
    if (activationFrameRef.current !== null) {
      window.cancelAnimationFrame(activationFrameRef.current);
      activationFrameRef.current = null;
    }
  }, []);

  const cancelStabilization = React.useCallback(() => {
    if (stabilizationFrameRef.current !== null) {
      window.cancelAnimationFrame(stabilizationFrameRef.current);
      stabilizationFrameRef.current = null;
    }

    stabilizationTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    stabilizationTimeoutsRef.current = [];
  }, []);

  const clearReleaseTimeout = React.useCallback(() => {
    if (releaseTimeoutRef.current !== null) {
      window.clearTimeout(releaseTimeoutRef.current);
      releaseTimeoutRef.current = null;
    }
  }, []);

  const cancelPendingCategoryClickWork = React.useCallback(() => {
    cancelActivationFrame();
    cancelStabilization();
    clearReleaseTimeout();
  }, [cancelActivationFrame, cancelStabilization, clearReleaseTimeout]);

  const clearCategoryActivation = React.useCallback(
    (categoryId?: string) => {
      cancelPendingCategoryClickWork();

      setActivationBlockedCategoryId((currentCategoryId) =>
        !categoryId || currentCategoryId === categoryId
          ? null
          : currentCategoryId,
      );
      setForceActivatedCategoryId((currentCategoryId) =>
        !categoryId || currentCategoryId === categoryId
          ? null
          : currentCategoryId,
      );
    },
    [cancelPendingCategoryClickWork],
  );

  const scheduleActivationRelease = React.useCallback(
    (categoryId: string) => {
      clearReleaseTimeout();
      releaseTimeoutRef.current = window.setTimeout(() => {
        releaseTimeoutRef.current = null;
        clearCategoryActivation(categoryId);
      }, CATEGORY_CLICK_LOCK_MS);
    },
    [clearCategoryActivation, clearReleaseTimeout],
  );

  const scheduleActivationSettledState = React.useCallback(
    (categoryId: string) => {
      cancelActivationFrame();
      let frameCount = 0;

      const tick = () => {
        frameCount += 1;

        if (frameCount >= CATEGORY_CLICK_ACTIVATION_SETTLE_FRAMES) {
          activationFrameRef.current = null;
          setActivationBlockedCategoryId((currentCategoryId) =>
            currentCategoryId === categoryId ? null : currentCategoryId,
          );
          setForceActivatedCategoryId(categoryId);
          return;
        }

        activationFrameRef.current = window.requestAnimationFrame(tick);
      };

      activationFrameRef.current = window.requestAnimationFrame(tick);
    },
    [cancelActivationFrame],
  );

  const stabilizeCategoryScroll = React.useCallback(
    (categoryId: string) => {
      cancelStabilization();

      const alignCategory = () => {
        scrollCategorySectionIntoView(categoryId, {
          behavior: "instant",
        });
      };

      let frameCount = 0;

      const alignOnFrame = () => {
        stabilizationFrameRef.current = null;
        frameCount += 1;
        alignCategory();

        if (frameCount >= CATEGORY_CLICK_INSTANT_STABILIZATION_FRAMES) {
          return;
        }

        stabilizationFrameRef.current =
          window.requestAnimationFrame(alignOnFrame);
      };

      stabilizationFrameRef.current =
        window.requestAnimationFrame(alignOnFrame);
      stabilizationTimeoutsRef.current =
        CATEGORY_CLICK_INSTANT_STABILIZATION_DELAYS_MS.map((delayMs) =>
          window.setTimeout(alignCategory, delayMs),
        );
    },
    [cancelStabilization],
  );

  const handleCategoryClick = React.useCallback(
    (category: { id: string }) => {
      if (!enabled || typeof window === "undefined") {
        return;
      }

      cancelPendingCategoryClickWork();

      flushSync(() => {
        setActivationBlockedCategoryId(category.id);
        setForceActivatedCategoryId(category.id);
      });

      const didScroll = scrollCategorySectionIntoView(category.id, {
        behavior: "instant",
      });

      if (didScroll) {
        stabilizeCategoryScroll(category.id);
      }

      scheduleActivationSettledState(category.id);
      scheduleActivationRelease(category.id);
    },
    [
      cancelPendingCategoryClickWork,
      enabled,
      scheduleActivationRelease,
      scheduleActivationSettledState,
      stabilizeCategoryScroll,
    ],
  );

  React.useEffect(() => {
    if (enabled) {
      return;
    }

    clearCategoryActivation();
  }, [clearCategoryActivation, enabled]);

  React.useEffect(() => {
    if (
      !enabled ||
      !forceActivatedCategoryId ||
      typeof window === "undefined"
    ) {
      return;
    }

    const releaseForcedActivation = () => {
      clearCategoryActivation(forceActivatedCategoryId);
    };

    window.addEventListener("keydown", releaseForcedActivation);
    window.addEventListener("pointerdown", releaseForcedActivation, {
      passive: true,
    });
    window.addEventListener("touchstart", releaseForcedActivation, {
      passive: true,
    });
    window.addEventListener("wheel", releaseForcedActivation, {
      passive: true,
    });

    return () => {
      window.removeEventListener("keydown", releaseForcedActivation);
      window.removeEventListener("pointerdown", releaseForcedActivation);
      window.removeEventListener("touchstart", releaseForcedActivation);
      window.removeEventListener("wheel", releaseForcedActivation);
    };
  }, [clearCategoryActivation, enabled, forceActivatedCategoryId]);

  React.useEffect(() => {
    return () => {
      cancelPendingCategoryClickWork();
    };
  }, [cancelPendingCategoryClickWork]);

  return {
    activationBlockedCategoryId,
    forceActivatedCategoryId,
    handleCategoryClick,
  };
}
