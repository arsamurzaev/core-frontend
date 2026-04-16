"use client";

import {
  MAX_CATEGORY_DESCRIPTOR_LENGTH,
  MAX_CATEGORY_NAME_LENGTH,
} from "@/core/modules/product/editor/lib/category-editor";
import {
  type CategoryImageUploadState,
} from "@/core/modules/product/editor/lib/upload-category-image";
import { CreateProductCategoryImageField } from "@/core/modules/product/editor/ui/create-product-category-image-field";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { CharacterLimitedTextarea } from "@/shared/ui/character-limited-textarea";
import { Input } from "@/shared/ui/input";
import { Progress } from "@/shared/ui/progress";
import React from "react";

interface CreateProductCategoryEditorDrawerProps {
  buttonText?: string;
  description: string;
  disabled?: boolean;
  existingUrl?: string | null;
  file?: File;
  headerAction?: React.ReactNode;
  loading?: boolean;
  name: string;
  onDescriptorChange: (value: string) => void;
  onFileChange: (file: File | undefined) => void;
  onNameChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  open: boolean;
  descriptor: string;
  title: string;
  uploadState: CategoryImageUploadState;
  withCloseButton?: boolean;
}

export function CreateProductCategoryEditorDrawer({
  buttonText,
  description,
  disabled = false,
  existingUrl,
  file,
  headerAction,
  loading = false,
  name,
  onDescriptorChange,
  onFileChange,
  onNameChange,
  onOpenChange,
  onSubmit,
  open,
  descriptor,
  title,
  uploadState,
  withCloseButton = true,
}: CreateProductCategoryEditorDrawerProps) {
  return (
    <AppDrawer open={open} onOpenChange={onOpenChange} dismissible={!disabled}>
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title={title}
            description={description}
            trailingTitleNode={headerAction}
            withCloseButton={withCloseButton}
          />
          <hr />

          <div className="space-y-6 px-6 py-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Категория:</p>
              <Input
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="Например: Стулья"
                maxLength={MAX_CATEGORY_NAME_LENGTH}
                disabled={disabled}
              />
            </div>

            <CreateProductCategoryImageField
              file={file}
              existingUrl={existingUrl}
              onChange={onFileChange}
              disabled={disabled}
            />

            <div className="space-y-2">
              <p className="text-sm font-medium">Дескриптор:</p>
              <CharacterLimitedTextarea
                value={descriptor}
                onChange={(event) => onDescriptorChange(event.target.value)}
                placeholder="Например: на любой вкус и цвет"
                maxLength={MAX_CATEGORY_DESCRIPTOR_LENGTH}
                disabled={disabled}
              />
            </div>

            {uploadState.phase !== "idle" ? (
              <div className="space-y-2 rounded-2xl border border-black/10 bg-muted/15 p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>{uploadState.message}</span>
                  <span className="text-muted-foreground">
                    {Math.round(uploadState.progress)}%
                  </span>
                </div>
                <Progress value={uploadState.progress} />
              </div>
            ) : null}
          </div>

          <AppDrawer.Footer
            className="border-t"
            isAutoClose={false}
            loading={loading}
            btnText={buttonText}
            buttonType="button"
            handleClick={() => void onSubmit()}
          />
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
}

