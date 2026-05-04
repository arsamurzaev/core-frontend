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

export function useCategoryClickActivationDelay({
  enabled = true,
}: UseCategoryClickActivationDelayParams = {}): UseCategoryClickActivationDelayResult {
  const frameRef = React.useRef<number | null>(null);
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

    cancelScrollWatcher();
    setActivationBlockedCategoryId(null);
    setForceActivatedCategoryId(null);
  }, [cancelScrollWatcher, enabled]);

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
