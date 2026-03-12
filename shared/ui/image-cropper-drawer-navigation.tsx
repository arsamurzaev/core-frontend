"use client";

import { type CropperSourceItem } from "@/shared/lib/image-cropper";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import NextImage from "next/image";
import React from "react";

type ImageCropperDrawerNavigationProps = {
  activeIndex: number;
  isApplying: boolean;
  isRequiredSequential: boolean;
  isSwitching: boolean;
  onSelectItem: (index: number) => void | Promise<void>;
  previewById: Record<string, string>;
  sourceItems: CropperSourceItem[];
};

export const ImageCropperDrawerNavigation: React.FC<
  ImageCropperDrawerNavigationProps
> = ({
  activeIndex,
  isApplying,
  isRequiredSequential,
  isSwitching,
  onSelectItem,
  previewById,
  sourceItems,
}) => {
  if (sourceItems.length <= 1) {
    return null;
  }

  if (isRequiredSequential) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
        {`Шаг ${activeIndex + 1} из ${sourceItems.length}: обрежьте текущее изображение и продолжайте.`}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => void onSelectItem(Math.max(activeIndex - 1, 0))}
        disabled={activeIndex === 0 || isApplying || isSwitching}
        aria-label="Предыдущее изображение"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex-1 overflow-x-auto">
        <ul className="flex gap-2 pb-1">
          {sourceItems.map((item, index) => {
            const isActive = index === activeIndex;
            const previewUrl = previewById[item.id] ?? item.sourceUrl;
            const isEdited = Boolean(previewById[item.id]);

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => void onSelectItem(index)}
                  className={cn(
                    "relative flex h-16 w-12 overflow-hidden rounded-md border",
                    isActive
                      ? "border-primary ring-2 ring-primary/40"
                      : "border-border",
                  )}
                  disabled={isApplying || isSwitching}
                  aria-label={`Выбрать изображение ${index + 1}`}
                >
                  <NextImage
                    src={previewUrl}
                    alt={`Изображение ${index + 1}`}
                    width={48}
                    height={64}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                  {isEdited ? (
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-center text-[10px] uppercase tracking-wide text-white">
                      Обрезано
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() =>
          void onSelectItem(Math.min(activeIndex + 1, sourceItems.length - 1))
        }
        disabled={
          activeIndex === sourceItems.length - 1 || isApplying || isSwitching
        }
        aria-label="Следующее изображение"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
};
