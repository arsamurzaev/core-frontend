"use client";

import {
  type UploadState,
} from "@/core/modules/product/editor/model/types";
import { ProductImageGridItem } from "@/core/modules/product/editor/ui/product-image-grid-item";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Progress } from "@/shared/ui/progress";
import { ArrowLeftRight, ImagePlus } from "lucide-react";
import React from "react";

export interface ProductImageSectionItem {
  key: string;
  label: string;
  previewUrl: string;
}

export interface ProductImagesSectionProps {
  items: ProductImageSectionItem[];
  isSubmitting: boolean;
  isCropperOpen: boolean;
  isReorderMode: boolean;
  isInitialCropRequired: boolean;
  pendingSwapIndex: number | null;
  uploadState: UploadState;
  uploadedMediaIds: string[];
  onFilesChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleReorderMode: () => void;
  onSelectFileForSwap: (index: number) => void;
  onEditFile: (index: number) => void;
  onRemoveFile: (index: number) => void;
}

export const ProductImagesSection: React.FC<ProductImagesSectionProps> = ({
  items,
  isSubmitting,
  isCropperOpen,
  isReorderMode,
  isInitialCropRequired,
  pendingSwapIndex,
  uploadState,
  uploadedMediaIds,
  onFilesChange,
  onToggleReorderMode,
  onSelectFileForSwap,
  onEditFile,
  onRemoveFile,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleAddPhotosClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <section className="space-y-4 text-center">
      <h3 className="text-sm font-semibold">
        Добавьте фото товара или услуги (от 1* до 12)
      </h3>
      <p className="text-xs text-muted-foreground">
        Для публикации необходимо хотя бы одно фото.
        <br />
        Главное фото для карточки стоит первым.
      </p>

      <Input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={onFilesChange}
        disabled={isSubmitting || isCropperOpen}
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        size="full"
        onClick={handleAddPhotosClick}
        disabled={isSubmitting || isCropperOpen}
      >
        <ImagePlus className="size-4" />
        {items.length === 0 ? "Добавить фото" : "Добавить еще фото"}
      </Button>

      {items.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant={isReorderMode ? "default" : "outline"}
            className="gap-1.5"
            onClick={onToggleReorderMode}
            disabled={
              isSubmitting ||
              isCropperOpen ||
              isInitialCropRequired ||
              items.length < 2
            }
          >
            <ArrowLeftRight className="size-4" />
            {isReorderMode ? "Режим порядка: вкл" : "Изменить порядок"}
          </Button>
        </div>
      ) : null}

      {isReorderMode ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-2 text-left text-xs text-primary">
          {pendingSwapIndex === null
            ? "Режим изменения порядка включен: выберите первую фотографию."
            : `Выбрана фотография ${pendingSwapIndex + 1}. Выберите вторую, чтобы поменять местами.`}
        </div>
      ) : null}

      {items.length > 0 && isInitialCropRequired ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-left text-xs text-amber-700">
          Первичное добавление: обязательная последовательная обрезка фотографий
          (1, 2, 3 ...).
        </div>
      ) : null}

      {items.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2">
          {items.map((item, index) => {
            return (
              <ProductImageGridItem
                key={item.key}
                index={index}
                label={item.label}
                previewUrl={item.previewUrl}
                disabled={isSubmitting || isCropperOpen}
                isReorderMode={isReorderMode}
                isSwapCandidate={pendingSwapIndex === index}
                onSelectForSwap={() => onSelectFileForSwap(index)}
                onEdit={() => onEditFile(index)}
                onRemove={() => onRemoveFile(index)}
              />
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Файлы не выбраны.</p>
      )}

      {uploadState.phase !== "idle" ? (
        <div className="space-y-2 rounded-lg border p-2.5 text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {uploadState.message}
            </span>
            <span className="text-xs font-medium">
              {Math.round(uploadState.progress)}%
            </span>
          </div>
          <Progress value={uploadState.progress} />
        </div>
      ) : null}

      {uploadedMediaIds.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Загружено mediaId: {uploadedMediaIds.length}
        </p>
      ) : null}
    </section>
  );
};
