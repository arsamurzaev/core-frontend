"use client";

import { CreateProductCategoryEditorDrawer } from "@/core/modules/product/editor";
import { type UseCategoryAdminResult } from "@/core/widgets/category-admin/model/use-category-admin";
import { CategoryReorderDrawer } from "@/core/widgets/category-admin/ui/category-reorder-drawer";
import { ConfirmationDrawer } from "@/shared/ui/confirmation-drawer";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Trash2 } from "lucide-react";
import * as React from "react";

interface CategoryAdminDrawersProps {
  admin: UseCategoryAdminResult;
  createDescription?: string;
  editDescription?: string;
  supportsCategoryDetails?: boolean;
}

const DEFAULT_CREATE_DESCRIPTION =
  "Создайте новую категорию, чтобы она сразу появилась в каталоге и в карточках выбора.";
const DEFAULT_EDIT_DESCRIPTION =
  "Измените название, описание или изображение категории. Обновление сразу попадет в каталог.";

export const CategoryAdminDrawers: React.FC<CategoryAdminDrawersProps> = ({
  admin,
  createDescription = DEFAULT_CREATE_DESCRIPTION,
  editDescription = DEFAULT_EDIT_DESCRIPTION,
  supportsCategoryDetails = true,
}) => {
  const deleteProductsCheckboxId = React.useId();
  const deletingProductCount = admin.deletingCategory?.productCount ?? 0;

  return (
    <>
      <CreateProductCategoryEditorDrawer
        open={admin.isCreateOpen}
        onOpenChange={(nextOpen) => {
          admin.setIsCreateOpen(nextOpen);

          if (!nextOpen && !admin.isCreateBusy) {
            admin.resetCreateForm();
          }
        }}
        title="Редактор категории"
        description={createDescription}
        name={admin.createName}
        descriptor={admin.createDescriptor}
        file={admin.createImageFile}
        uploadState={admin.createUploadState}
        supportsCategoryDetails={supportsCategoryDetails}
        disabled={admin.isCreateBusy}
        loading={admin.isCreateBusy}
        withCloseButton={!admin.isCreateBusy}
        buttonText="Добавить категорию"
        onNameChange={admin.setCreateName}
        onDescriptorChange={admin.setCreateDescriptor}
        onFileChange={admin.setCreateImageFile}
        onSubmit={admin.handleCreateCategory}
      />

      <CreateProductCategoryEditorDrawer
        open={Boolean(admin.editingCategory)}
        onOpenChange={admin.handleEditOpenChange}
        title="Редактор категории"
        description={editDescription}
        name={admin.editName}
        descriptor={admin.editDescriptor}
        file={admin.editImageFile}
        existingUrl={admin.editingCategory?.imageMedia?.url ?? null}
        supportsCategoryDetails={supportsCategoryDetails}
        headerAction={
          admin.editingCategory ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => {
                admin.setDeletingCategory(admin.editingCategory);
              }}
              aria-label="Удалить категорию"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null
        }
        uploadState={admin.editUploadState}
        disabled={admin.isEditBusy}
        loading={admin.isEditBusy}
        withCloseButton={!admin.isEditBusy}
        buttonText="Сохранить изменения"
        onNameChange={admin.setEditName}
        onDescriptorChange={admin.setEditDescriptor}
        onFileChange={admin.setEditImageFile}
        onSubmit={admin.handleUpdateCategory}
      />

      <CategoryReorderDrawer
        open={admin.isReorderOpen}
        onOpenChange={admin.handleReorderOpenChange}
        categories={admin.reorderCategories}
        hasChanges={admin.hasReorderChanges}
        isSaving={admin.isReorderBusy}
        supportsCategoryDetails={supportsCategoryDetails}
        onReorder={(params) => void admin.handleReorderCategory(params)}
        onSave={() => void admin.handleSaveCategoryOrder()}
      />

      <ConfirmationDrawer
        open={Boolean(admin.deletingCategory)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            admin.setDeletingCategory(null);
          }
        }}
        title="Удалить категорию?"
        description={
          admin.deletingCategory
            ? `Категория "${admin.deletingCategory.name}" будет удалена из каталога.`
            : undefined
        }
        confirmText="Удалить"
        pendingText="Удаление..."
        tone="destructive"
        onConfirm={admin.handleDeleteCategory}
      >
        {admin.deletingCategory ? (
          <label
            htmlFor={deleteProductsCheckboxId}
            className="flex cursor-pointer items-start gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm"
          >
            <Checkbox
              id={deleteProductsCheckboxId}
              checked={admin.deleteProductsWithCategory}
              disabled={deletingProductCount <= 0}
              onCheckedChange={(checked) =>
                admin.setDeleteProductsWithCategory(checked === true)
              }
              className="mt-0.5"
            />
            <span className="font-medium text-foreground">
              Удалить товары (кол-во: {deletingProductCount})
            </span>
          </label>
        ) : null}
      </ConfirmationDrawer>
    </>
  );
};
