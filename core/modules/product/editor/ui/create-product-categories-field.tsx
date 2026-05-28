"use client";

import { useCreateProductCategoriesField } from "@/core/modules/product/editor/model/use-create-product-categories-field";
import { type CreateProductFormValues } from "@/core/modules/product/editor/model/form-config";
import { CreateProductCategorySelectionDrawer } from "@/core/modules/product/editor/ui/create-product-category-selection-drawer";
import { CreateProductCategoryEditorDrawer } from "@/core/modules/product/editor/ui/create-product-category-editor-drawer";
import { CreateProductCategoriesSummary } from "@/core/modules/product/editor/ui/create-product-categories-summary";
import { ConfirmationDrawer } from "@/shared/ui/confirmation-drawer";
import { Checkbox } from "@/shared/ui/checkbox";
import { type DynamicFieldRenderProps } from "@/shared/ui/dynamic-form";
import * as React from "react";

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
    deleteProductsWithCategory,
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
    setDeleteProductsWithCategory,
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
  const deleteProductsCheckboxId = React.useId();
  const deletingProductCount = deletingCategory?.productCount ?? 0;

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
      >

      <CreateProductCategoryEditorDrawer
        open={isCreateDrawerOpen}
        nested
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
        nested
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
        drawerProps={{ nested: true }}
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
      >
        {deletingCategory ? (
          <label
            htmlFor={deleteProductsCheckboxId}
            className="flex cursor-pointer items-start gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm"
          >
            <Checkbox
              id={deleteProductsCheckboxId}
              checked={deleteProductsWithCategory}
              disabled={deletingProductCount <= 0}
              onCheckedChange={(checked) =>
                setDeleteProductsWithCategory(checked === true)
              }
              className="mt-0.5"
            />
            <span className="font-medium text-foreground">
              Удалить товары (кол-во: {deletingProductCount})
            </span>
          </label>
        ) : null}
      </ConfirmationDrawer>
      </CreateProductCategorySelectionDrawer>
    </>
  );
}

