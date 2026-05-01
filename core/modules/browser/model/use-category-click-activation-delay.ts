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

const CATEGORY_CLICK_ACTIVATION_DELAY_MS = 200;

export function useCategoryClickActivationDelay({
  enabled = true,
}: UseCategoryClickActivationDelayParams = {}): UseCategoryClickActivationDelayResult {
  const timerRef = React.useRef<number | null>(null);
  const [activationBlockedCategoryId, setActivationBlockedCategoryId] =
    React.useState<string | null>(null);
  const [forceActivatedCategoryId, setForceActivatedCategoryId] =
    React.useState<string | null>(null);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleCategoryClick = React.useCallback(
    (category: { id: string }) => {
      if (!enabled || typeof window === "undefined") {
        return;
      }

      clearTimer();

      flushSync(() => {
        setActivationBlockedCategoryId(category.id);
        setForceActivatedCategoryId(null);
      });

      scrollCategorySectionIntoView(category.id);

      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        setActivationBlockedCategoryId(null);
        setForceActivatedCategoryId(category.id);
      }, CATEGORY_CLICK_ACTIVATION_DELAY_MS);
    },
    [clearTimer, enabled],
  );

  React.useEffect(() => {
    if (enabled) {
      return;
    }

    clearTimer();
    setActivationBlockedCategoryId(null);
    setForceActivatedCategoryId(null);
  }, [clearTimer, enabled]);

  React.useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    activationBlockedCategoryId,
    forceActivatedCategoryId,
    handleCategoryClick,
  };
}
