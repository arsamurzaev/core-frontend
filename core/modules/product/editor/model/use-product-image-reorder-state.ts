"use client";

import React from "react";

export interface UseProductImageReorderStateParams {
  isCropperOpen: boolean;
  isInitialCropRequired: boolean;
  isSubmitting: boolean;
  itemCount: number;
  onSwap: (leftIndex: number, rightIndex: number) => void;
}

export interface UseProductImageReorderStateResult {
  clearPendingSwapSelection: () => void;
  exitReorderMode: () => void;
  handleSelectItemForSwap: (index: number) => void;
  handleToggleReorderMode: () => void;
  isReorderMode: boolean;
  pendingSwapIndex: number | null;
}

export function useProductImageReorderState({
  isCropperOpen,
  isInitialCropRequired,
  isSubmitting,
  itemCount,
  onSwap,
}: UseProductImageReorderStateParams): UseProductImageReorderStateResult {
  const [isReorderMode, setIsReorderMode] = React.useState(false);
  const [pendingSwapIndex, setPendingSwapIndex] = React.useState<number | null>(
    null,
  );

  React.useEffect(() => {
    if (itemCount < 2) {
      setIsReorderMode(false);
      setPendingSwapIndex(null);
      return;
    }

    if (pendingSwapIndex !== null && pendingSwapIndex >= itemCount) {
      setPendingSwapIndex(null);
    }
  }, [itemCount, pendingSwapIndex]);

  const clearPendingSwapSelection = React.useCallback(() => {
    setPendingSwapIndex(null);
  }, []);

  const exitReorderMode = React.useCallback(() => {
    setIsReorderMode(false);
    setPendingSwapIndex(null);
  }, []);

  const handleToggleReorderMode = React.useCallback(() => {
    if (
      isSubmitting ||
      isCropperOpen ||
      isInitialCropRequired ||
      itemCount < 2
    ) {
      return;
    }

    setPendingSwapIndex(null);
    setIsReorderMode((current) => !current);
  }, [isCropperOpen, isInitialCropRequired, isSubmitting, itemCount]);

  const handleSelectItemForSwap = React.useCallback(
    (index: number) => {
      if (!isReorderMode || isSubmitting || isCropperOpen) {
        return;
      }

      if (pendingSwapIndex === null) {
        setPendingSwapIndex(index);
        return;
      }

      if (pendingSwapIndex === index) {
        setPendingSwapIndex(null);
        return;
      }

      onSwap(pendingSwapIndex, index);
      setPendingSwapIndex(null);
    },
    [isCropperOpen, isReorderMode, isSubmitting, onSwap, pendingSwapIndex],
  );

  return {
    clearPendingSwapSelection,
    exitReorderMode,
    handleSelectItemForSwap,
    handleToggleReorderMode,
    isReorderMode,
    pendingSwapIndex,
  };
}
