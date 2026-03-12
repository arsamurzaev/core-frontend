"use client";

import { Button } from "@/shared/ui/button";
import { RotateCcw } from "lucide-react";
import React from "react";

type ImageCropperDrawerStatusProps = {
  activeIndex: number;
  aspectRatio: number;
  errorMessage: string | null;
  hasActiveItem: boolean;
  isApplying: boolean;
  isRequiredSequential: boolean;
  isSwitching: boolean;
  onResetCurrent: () => void;
  totalItems: number;
};

export const ImageCropperDrawerStatus: React.FC<
  ImageCropperDrawerStatusProps
> = ({
  activeIndex,
  aspectRatio,
  errorMessage,
  hasActiveItem,
  isApplying,
  isRequiredSequential,
  isSwitching,
  onResetCurrent,
  totalItems,
}) => {
  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
        <div className="text-xs text-muted-foreground">
          {totalItems > 0
            ? `Изображение ${activeIndex + 1} из ${totalItems}. Соотношение ${aspectRatio.toFixed(2)}`
            : "Нет изображения"}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onResetCurrent}
          disabled={!hasActiveItem || isApplying || isSwitching}
          className="gap-2"
        >
          <RotateCcw className="size-4" />
          {isRequiredSequential
            ? "Сбросить текущую обрезку"
            : "Сбросить текущее"}
        </Button>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}
    </>
  );
};
