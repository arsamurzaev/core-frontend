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

const CATEGORY_CLICK_ACTIVATION_SETTLE_FRAMES = 1;
const FORCED_ACTIVATION_SCROLL_GRACE_MS = 250;

export function useCategoryClickActivationDelay({
  enabled = true,
}: UseCategoryClickActivationDelayParams = {}): UseCategoryClickActivationDelayResult {
  const frameRef = React.useRef<number | null>(null);
  const forcedActivationStartedAtRef = React.useRef(0);
  const [activationBlockedCategoryId, setActivationBlockedCategoryId] =
    React.useState<string | null>(null);
  const [forceActivatedCategoryId, setForceActivatedCategoryId] =
    React.useState<string | null>(null);

  const cancelScrollWatcher = React.useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const finishScrollActivation = React.useCallback(
    (categoryId: string) => {
      cancelScrollWatcher();
      setActivationBlockedCategoryId((currentCategoryId) =>
        currentCategoryId === categoryId ? null : currentCategoryId,
      );
      forcedActivationStartedAtRef.current = Date.now();
      setForceActivatedCategoryId(categoryId);
    },
    [cancelScrollWatcher],
  );

  const scheduleScrollActivation = React.useCallback(
    (categoryId: string) => {
      let frameCount = 0;

      const tick = () => {
        frameCount += 1;

        if (frameCount >= CATEGORY_CLICK_ACTIVATION_SETTLE_FRAMES) {
          finishScrollActivation(categoryId);
          return;
        }

        frameRef.current = window.requestAnimationFrame(tick);
      };

      frameRef.current = window.requestAnimationFrame(tick);
    },
    [finishScrollActivation],
  );

  const handleCategoryClick = React.useCallback(
    (category: { id: string }) => {
      if (!enabled || typeof window === "undefined") {
        return;
      }

      cancelScrollWatcher();

      flushSync(() => {
        setActivationBlockedCategoryId(category.id);
        setForceActivatedCategoryId(null);
      });

      const didScroll = scrollCategorySectionIntoView(category.id, {
        behavior: "instant",
      });

      if (!didScroll) {
        finishScrollActivation(category.id);
        return;
      }

      scheduleScrollActivation(category.id);
    },
    [
      cancelScrollWatcher,
      enabled,
      finishScrollActivation,
      scheduleScrollActivation,
    ],
  );

  React.useEffect(() => {
    if (enabled) {
      return;
    }

    forcedActivationStartedAtRef.current = 0;
    cancelScrollWatcher();
    setActivationBlockedCategoryId(null);
    setForceActivatedCategoryId(null);
  }, [cancelScrollWatcher, enabled]);

  React.useEffect(() => {
    if (!enabled || !forceActivatedCategoryId || typeof window === "undefined") {
      return;
    }

    const releaseForcedActivation = () => {
      const elapsed = Date.now() - forcedActivationStartedAtRef.current;

      if (elapsed < FORCED_ACTIVATION_SCROLL_GRACE_MS) {
        return;
      }

      forcedActivationStartedAtRef.current = 0;
      setForceActivatedCategoryId(null);
    };

    window.addEventListener("scroll", releaseForcedActivation, {
      passive: true,
    });
    window.addEventListener("wheel", releaseForcedActivation, {
      passive: true,
    });
    window.addEventListener("touchmove", releaseForcedActivation, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", releaseForcedActivation);
      window.removeEventListener("wheel", releaseForcedActivation);
      window.removeEventListener("touchmove", releaseForcedActivation);
    };
  }, [enabled, forceActivatedCategoryId]);

  React.useEffect(() => {
    return () => {
      cancelScrollWatcher();
    };
  }, [cancelScrollWatcher]);

  return {
    activationBlockedCategoryId,
    forceActivatedCategoryId,
    handleCategoryClick,
  };
}
