"use client";

import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import {
  CREATE_PRODUCT_FORM_DEFAULT_VALUES,
  type CreateProductFormValues,
} from "@/core/modules/product/editor/model/form-config";
import { useProductFormFields } from "@/core/modules/product/editor/model/use-product-form-fields";
import { isMoySkladProduct } from "@/core/modules/product/model/moysklad-product";
import {
  buildVariantsFormValueFromExisting,
  normalizeVariantsFormValue,
} from "@/core/modules/product/editor/model/product-variants";
import { buildPersistedEditableAttributeValues } from "@/core/widgets/edit-product-drawer/model/edit-product-drawer-data";
import { useEditProductDrawerState } from "@/core/widgets/edit-product-drawer/model/use-edit-product-drawer-state";
import { useEditProductImageEditor } from "@/core/widgets/edit-product-drawer/model/use-edit-product-image-editor";
import { useEditProductSubmit } from "@/core/widgets/edit-product-drawer/model/use-edit-product-submit";
import { invalidateProductQueries } from "@/core/modules/product/actions/model";
import {
  useProductControllerGetById,
  useProductControllerRemove,
  useProductControllerSetVariantMatrix,
  useProductControllerUpdate,
} from "@/shared/api/generated/react-query";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { useCatalogCapabilities } from "@/shared/capabilities/catalog-capabilities";
import { confirmDelete } from "@/shared/ui/confirmation";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

function getMissingProductMessage(params: {
  error: unknown;
  isError: boolean;
}): string {
  return params.isError
    ? extractApiErrorMessage(params.error)
    : "Не удалось загрузить товар для редактирования.";
}

export function useEditProductDrawer(
  productId: string,
  onExternalOpenChange?: (open: boolean) => void,
  params: {
    supportsBrands?: boolean;
    supportsCategoryDetails?: boolean;
  } = {},
) {
  const { supportsBrands = true, supportsCategoryDetails = true } = params;
  const { type } = useCatalog();
  const features = useCatalogCapabilities();
  const queryClient = useQueryClient();
  const updateProduct = useProductControllerUpdate();
  const setVariantMatrix = useProductControllerSetVariantMatrix();
  const removeProduct = useProductControllerRemove();
  const form = useForm<CreateProductFormValues>({
    defaultValues: CREATE_PRODUCT_FORM_DEFAULT_VALUES,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const productQuery = useProductControllerGetById(productId, {
    query: {
      enabled: open && Boolean(productId),
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });
  const product = productQuery.data ?? null;
  const currentProductTypeId = product?.productType?.id ?? null;
  const isMoySkladLinkedProduct = isMoySkladProduct(product);
  const restoredVariantMatrixKeyRef = React.useRef<string | null>(null);

  const handleProductTypeChange = React.useCallback(() => {
    if (!features.canUseProductTypes || isMoySkladLinkedProduct) {
      form.setValue("productTypeId", currentProductTypeId ?? undefined, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }
  }, [
    currentProductTypeId,
    form,
    features.canUseProductTypes,
    isMoySkladLinkedProduct,
  ]);

  const {
    formFields,
    isProductTypeSchemaResolving,
    productAttributes,
    variantAttributes,
    visibleAttributes,
  } = useProductFormFields({
    form,
    sourceAttributes: type.attributes,
    disableProductTypeField:
      !features.canUseProductTypes || isMoySkladLinkedProduct,
    canUseProductTypes: features.canUseProductTypes,
    canUseProductVariants: features.canUseProductVariants,
    canUseCatalogSaleUnits: features.canUseCatalogSaleUnits,
    isActive: open,
    supportsBrands,
    supportsCategoryDetails,
    onProductTypeChange: handleProductTypeChange,
  });
  const persistedAttributeValues = React.useMemo(
    () =>
      product
        ? buildPersistedEditableAttributeValues(product, productAttributes)
        : {},
    [product, productAttributes],
  );

  const imageEditor = useEditProductImageEditor({
    isSubmitting,
  });

  const isDeleting = removeProduct.isPending;
  const isBusy = isSubmitting || isDeleting || isProductTypeSchemaResolving;

  const drawerState = useEditProductDrawerState({
    form,
    isSubmitting: isBusy,
    open,
    product,
    productAttributes,
    variantAttributes,
    productQueryError: productQuery.error,
    productQueryIsError: productQuery.isError,
    resetFromMedia: imageEditor.resetFromMedia,
    setOpen,
  });
  const variantMatrixRestoreKey = React.useMemo(() => {
    if (!product || variantAttributes.length === 0) {
      return null;
    }

    const schemaKey = variantAttributes
      .map(
        (attribute) =>
          `${attribute.id}:${(attribute.enumValues ?? [])
            .map((enumValue) => enumValue.id)
            .join(",")}`,
      )
      .join("|");
    const variantsKey = (product.variants ?? [])
      .map(
        (variant) =>
          `${variant.id}:${variant.variantKey}:${variant.status}:${variant.stock}:${(
            variant.attributes ?? []
          )
            .map(
              (attribute) =>
                `${attribute.attributeId}=${attribute.enumValueId ?? ""}`,
            )
            .sort()
            .join(",")}`,
      )
      .join("|");

    return `${product.id}:${product.updatedAt ?? ""}:${schemaKey}:${variantsKey}`;
  }, [product, variantAttributes]);

  const handleCloseDrawer = React.useCallback(() => {
    drawerState.closeDrawer();
    onExternalOpenChange?.(false);
  }, [drawerState, onExternalOpenChange]);

  React.useEffect(() => {
    if (!open) {
      restoredVariantMatrixKeyRef.current = null;
    }
  }, [open]);

  React.useEffect(() => {
    if (!open || !product || !variantMatrixRestoreKey) {
      return;
    }

    if (restoredVariantMatrixKeyRef.current === variantMatrixRestoreKey) {
      return;
    }

    const current = normalizeVariantsFormValue(form.getValues("variants"));
    const hasCurrentVariantSelections = current.selectedAttributeIds.some(
      (attributeId) =>
        (current.selectedValueIdsByAttributeId[attributeId] ?? []).length > 0,
    );
    if (hasCurrentVariantSelections) {
      restoredVariantMatrixKeyRef.current = variantMatrixRestoreKey;
      return;
    }

    const restored = buildVariantsFormValueFromExisting(
      product.variants ?? [],
      variantAttributes,
    );
    restoredVariantMatrixKeyRef.current = variantMatrixRestoreKey;

    if (restored.selectedAttributeIds.length === 0) {
      return;
    }

    form.setValue("variants", restored, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [form, open, product, variantAttributes, variantMatrixRestoreKey]);

  const handleDelete = React.useCallback(() => {
    if (isBusy) {
      return;
    }

    if (!product) {
      const message = getMissingProductMessage({
        error: productQuery.error,
        isError: productQuery.isError,
      });
      drawerState.setErrorMessage(message);
      toast.error(message);
      return;
    }

    void confirmDelete({
      title: "Удалить товар?",
      description: `Товар "${product.name}" будет удален без возможности восстановления.`,
      confirmText: "Удалить",
      pendingText: "Удаление...",
      tone: "destructive",
      onConfirm: async () => {
        await removeProduct.mutateAsync({ id: product.id });
        handleCloseDrawer();
        await invalidateProductQueries(queryClient);
        toast.success("Товар успешно удален.");
      },
      onError: (error) => {
        const message = extractApiErrorMessage(error);
        drawerState.setErrorMessage(message);
        toast.error(message);
      },
    });
  }, [
    drawerState,
    handleCloseDrawer,
    isBusy,
    product,
    productQuery.error,
    productQuery.isError,
    queryClient,
    removeProduct,
  ]);

  const handleBaseSubmit = useEditProductSubmit({
    closeDrawer: handleCloseDrawer,
    canUseCatalogSaleUnits: features.canUseCatalogSaleUnits,
    canUseProductVariants: features.canUseProductVariants,
    form,
    isInitialCropRequired: imageEditor.isInitialCropRequired,
    isSubmitting,
    openRequiredCropper: imageEditor.openRequiredCropper,
    pendingAddedFilesCount: imageEditor.pendingAddedFilesCount,
    persistedAttributeValues,
    product,
    productAttributes,
    productQueryError: productQuery.error,
    productQueryIsError: productQuery.isError,
    queryClient,
    resolveMediaIdsForSubmit: imageEditor.resolveMediaIdsForSubmit,
    setErrorMessage: drawerState.setErrorMessage,
    setIsSubmitting,
    setVariantMatrix,
    updateProduct,
    variantAttributes,
    visibleAttributes,
  });

  const handleSubmit = React.useCallback(() => {
    void handleBaseSubmit();
  }, [handleBaseSubmit]);

  return {
    cropperApplyLabel: imageEditor.cropperApplyLabel,
    cropperDescription: imageEditor.cropperDescription,
    cropperFiles: imageEditor.cropperFiles,
    cropperInitialIndex: imageEditor.cropperInitialIndex,
    cropperMode: imageEditor.cropperMode,
    cropperTitle: imageEditor.cropperTitle,
    errorMessage: drawerState.errorMessage,
    features,
    form,
    formFields,
    productAttributes,
    variantAttributes,
    handleCropApply: imageEditor.handleCropApply,
    handleCropperOpenChange: imageEditor.handleCropperOpenChange,
    handleEditItem: imageEditor.handleEditItem,
    handleFilesChange: imageEditor.handleFilesChange,
    handleDelete,
    handleOpenChange: drawerState.handleOpenChange,
    handleReset: drawerState.handleReset,
    handleSelectItemForSwap: imageEditor.handleSelectItemForSwap,
    handleSubmit,
    handleToggleReorderMode: imageEditor.handleToggleReorderMode,
    imageItems: imageEditor.imageItems,
    isCropperOpen: imageEditor.isCropperOpen,
    isBusy,
    isDeleting,
    isInitialCropRequired: imageEditor.isInitialCropRequired,
    isLoadingProduct: open && productQuery.isLoading && !product,
    isReorderMode: imageEditor.isReorderMode,
    isSubmitting,
    open: drawerState.open,
    pendingSwapIndex: imageEditor.pendingSwapIndex,
    product,
    removeItem: imageEditor.removeItem,
    uploadState: imageEditor.uploadState,
    uploadedMediaIds: imageEditor.uploadedMediaIds,
  };
}
