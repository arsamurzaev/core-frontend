"use client";

import { useCreateProductCategoriesField } from "@/core/modules/product/editor/model/use-create-product-categories-field";
import { type CreateProductFormValues } from "@/core/modules/product/editor/model/form-config";
import { CreateProductCategorySelectionDrawer } from "@/core/modules/product/editor/ui/create-product-category-selection-drawer";
import { CreateProductCategoryEditorDrawer } from "@/core/modules/product/editor/ui/create-product-category-editor-drawer";
import { CreateProductCategoriesSummary } from "@/core/modules/product/editor/ui/create-product-categories-summary";
import { ConfirmationDrawer } from "@/shared/ui/confirmation-drawer";
import { type DynamicFieldRenderProps } from "@/shared/ui/dynamic-form";

interface CreateProductCategoriesFieldProps
  extends DynamicFieldRenderProps<CreateProductFormValues> {
  supportsCategoryDetails?: boolean;
}

export function CreateProductCategoriesField(
  props: CreateProductCategoriesFieldProps,
) {
  const { field, placeholder, supportsCategoryDetails = true } = props;
  const {
    categoriesQuery,
    categoryList,
    createDescriptor,
    createImageFile,
    createName,
    createUploadState,
    deletingCategory,
    draftValues,
    editDescriptor,
    editImageFile,
    editName,
    editUploadState,
    editingCategory,
    handleApply,
    handleCreateCategory,
    handleDeleteCategory,
    handleEditOpenChange,
    handleStartEdit,
    handleUpdateCategory,
    hasChanges,
    isControlDisabled,
    isCreateBusy,
    isCreateDrawerOpen,
    isEditBusy,
    open,
    openDrawer,
    resetCreateForm,
    selectedCategories,
    selectedValues,
    setCreateDescriptor,
    setCreateImageFile,
    setCreateName,
    setDeletingCategory,
    setEditDescriptor,
    setEditImageFile,
    setEditName,
    setIsCreateDrawerOpen,
    setOpen,
    toggleDraftValue,
  } = useCreateProductCategoriesField({
    ...props,
    supportsCategoryDetails,
  });

  return (
    <>
      <CreateProductCategoriesSummary
        disabled={isControlDisabled}
        onOpen={openDrawer}
        onRemove={(categoryId) => {
          field.onChange(selectedValues.filter((value) => value !== categoryId));
          field.onBlur();
        }}
        placeholder={placeholder}
        selectedCategories={selectedCategories}
      />

      <CreateProductCategorySelectionDrawer
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            field.onBlur();
          }
        }}
        isControlDisabled={isControlDisabled}
        isLoading={categoriesQuery.isLoading}
        categoryList={categoryList}
        draftValues={draftValues}
        onRequestCreate={() => setIsCreateDrawerOpen(true)}
        onRequestDelete={setDeletingCategory}
        onRequestEdit={handleStartEdit}
        onToggleValue={toggleDraftValue}
        hasChanges={hasChanges}
        onApply={handleApply}
      />

      <CreateProductCategoryEditorDrawer
        open={isCreateDrawerOpen}
        onOpenChange={(nextOpen) => {
          setIsCreateDrawerOpen(nextOpen);
          if (!nextOpen && !isCreateBusy) {
            resetCreateForm();
          }
        }}
        title="Редактор категории"
        description="Создайте новую категорию, чтобы она сразу появилась в выборе товара."
        name={createName}
        descriptor={createDescriptor}
        file={createImageFile}
        uploadState={createUploadState}
        supportsCategoryDetails={supportsCategoryDetails}
        disabled={isCreateBusy}
        loading={isCreateBusy}
        withCloseButton={!isCreateBusy}
        onNameChange={setCreateName}
        onDescriptorChange={setCreateDescriptor}
        onFileChange={setCreateImageFile}
        onSubmit={handleCreateCategory}
      />

      <CreateProductCategoryEditorDrawer
        open={Boolean(editingCategory)}
        onOpenChange={handleEditOpenChange}
        title="Редактор категории"
        description="Измените категорию. Обновление сразу попадет в список выбора товара."
        name={editName}
        descriptor={editDescriptor}
        file={editImageFile}
        existingUrl={editingCategory?.imageUrl}
        uploadState={editUploadState}
        supportsCategoryDetails={supportsCategoryDetails}
        disabled={isEditBusy}
        loading={isEditBusy}
        withCloseButton={!isEditBusy}
        onNameChange={setEditName}
        onDescriptorChange={setEditDescriptor}
        onFileChange={setEditImageFile}
        onSubmit={handleUpdateCategory}
      />

      <ConfirmationDrawer
        open={Boolean(deletingCategory)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDeletingCategory(null);
          }
        }}
        title="Удалить категорию?"
        description={
          deletingCategory
            ? `Категория "${deletingCategory.name}" будет удалена из каталога.`
            : undefined
        }
        confirmText="Удалить"
        pendingText="Удаление..."
        tone="destructive"
        onConfirm={handleDeleteCategory}
      />
    </>
  );
}

