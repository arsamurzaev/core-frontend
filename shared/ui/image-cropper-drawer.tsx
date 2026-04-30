"use client";

import { useImageCropperDrawer } from "@/shared/hooks/use-image-cropper-drawer";
import {
  type CropperOutputOptions,
  type CropperSessionMode,
} from "@/shared/lib/image-cropper";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerScrollArea,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { ImageCropperDrawerNavigation } from "@/shared/ui/image-cropper-drawer-navigation";
import { ImageCropperDrawerStatus } from "@/shared/ui/image-cropper-drawer-status";
import { Crop, Loader2 } from "lucide-react";
import React from "react";
import {
  Cropper,
  ImageRestriction,
  Priority,
  RectangleStencil,
} from "react-advanced-cropper";

export type ImageCropperDrawerProps = {
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  files: File[];
  initialIndex?: number;
  mode?: CropperSessionMode;
  onApply: (files: File[]) => void | Promise<void>;
  className?: string;
  aspectRatio?: number;
  title?: React.ReactNode;
  description?: React.ReactNode;
  cancelLabel?: string;
  applyLabel?: string;
  outputOptions?: CropperOutputOptions;
};

export const ImageCropperDrawer: React.FC<ImageCropperDrawerProps> = ({
  open,
  onOpenChange,
  files,
  initialIndex = 0,
  mode = "optional",
  onApply,
  className,
  aspectRatio = 3 / 4,
  title = "Обрезка изображений",
  description = "Настройте обрезку одного или нескольких изображений перед загрузкой.",
  cancelLabel = "Отмена",
  applyLabel = "Применить",
  outputOptions,
}) => {
  const {
    activeDraft,
    activeIndex,
    activeItem,
    applyButtonLabel,
    buildInitialCoordinates,
    cropperKey,
    cropperRef,
    errorMessage,
    handleApply,
    handleCropperUpdate,
    handleOpenChange,
    handleResetCurrent,
    handleSelectItem,
    isApplying,
    isRequiredSequential,
    isSwitching,
    previewById,
    sourceItems,
  } = useImageCropperDrawer({
    open,
    onOpenChange,
    files,
    initialIndex,
    mode,
    onApply,
    aspectRatio,
    applyLabel,
    outputOptions,
  });

  return (
    <Drawer
      open={open}
      handleOnly
      onOpenChange={handleOpenChange}
      dismissible={!isApplying && !isSwitching}
    >
      <DrawerContent className={cn("mx-auto w-full max-w-5xl", className)}>
        <div className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader className="space-y-2">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>

          <DrawerScrollArea className="px-4 pb-4">
            {sourceItems.length === 0 ? (
              <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                Изображения не выбраны.
              </div>
            ) : (
              <div className="space-y-3">
                <ImageCropperDrawerNavigation
                  activeIndex={activeIndex}
                  isApplying={isApplying}
                  isRequiredSequential={isRequiredSequential}
                  isSwitching={isSwitching}
                  onSelectItem={handleSelectItem}
                  previewById={previewById}
                  sourceItems={sourceItems}
                />

                {activeItem ? (
                  <div className="rounded-xl border bg-muted/20 p-2">
                    <Cropper
                      key={cropperKey}
                      ref={cropperRef}
                      src={activeItem.sourceUrl}
                      className="h-[58dvh] w-full"
                      stencilComponent={RectangleStencil}
                      stencilProps={{
                        aspectRatio,
                        movable: true,
                        resizable: true,
                      }}
                      imageRestriction={ImageRestriction.stencil}
                      priority={Priority.coordinates}
                      transitions={false}
                      transformImage={{ adjustStencil: false }}
                      defaultCoordinates={
                        activeDraft?.coordinates ?? buildInitialCoordinates
                      }
                      defaultTransforms={activeDraft?.transforms ?? undefined}
                      onUpdate={handleCropperUpdate}
                    />
                  </div>
                ) : null}

                <ImageCropperDrawerStatus
                  activeIndex={activeIndex}
                  aspectRatio={aspectRatio}
                  errorMessage={errorMessage}
                  hasActiveItem={Boolean(activeItem)}
                  isApplying={isApplying}
                  isRequiredSequential={isRequiredSequential}
                  isSwitching={isSwitching}
                  onResetCurrent={handleResetCurrent}
                  totalItems={sourceItems.length}
                />
              </div>
            )}
          </DrawerScrollArea>

          <DrawerFooter className="border-t">
            <div className="grid w-full gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isApplying || isSwitching}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                onClick={() => void handleApply()}
                disabled={sourceItems.length === 0 || isApplying || isSwitching}
                className="gap-2"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Обработка...
                  </>
                ) : (
                  <>
                    <Crop className="size-4" />
                    {applyButtonLabel}
                  </>
                )}
              </Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
