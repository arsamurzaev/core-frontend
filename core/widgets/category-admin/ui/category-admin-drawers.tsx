"use client";

import { CreateProductCategoryEditorDrawer } from "@/core/modules/product/editor/ui/create-product-category-editor-drawer";
import { type UseCategoryAdminResult } from "@/core/widgets/category-admin/model/use-category-admin";
import { CategoryReorderDrawer } from "@/core/widgets/category-admin/ui/category-reorder-drawer";
import { ConfirmationDrawer } from "@/shared/ui/confirmation-drawer";
import { Button } from "@/shared/ui/button";
import { Trash2 } from "lucide-react";
import * as React from "react";

interface CategoryAdminDrawersProps {
  admin: UseCategoryAdminResult;
}

export const CategoryAdminDrawers: React.FC<CategoryAdminDrawersProps> = ({
  admin,
}) => {
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
        description="Создайте новую категорию, чтобы она сразу появилась в каталоге и в карточках выбора."
        name={admin.createName}
        descriptor={admin.createDescriptor}
        file={admin.createImageFile}
        uploadState={admin.createUploadState}
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
        description="Измените название, описание или изображение категории. Обновление сразу попадет в каталог."
        name={admin.editName}
        descriptor={admin.editDescriptor}
        file={admin.editImageFile}
        existingUrl={admin.editingCategory?.imageMedia?.url ?? null}
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
      />
    </>
  );
};
