"use client";

import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { useProductFormFields } from "@/core/modules/product/editor/model/use-product-form-fields";
import { useProductEditorForm } from "@/core/modules/product/editor/model/use-product-editor-form";
import {
  getProductIntegrationProviderLabel,
  isIntegratedProduct,
} from "@/core/modules/product/model/moysklad-product";
import {
  buildVariantsFormValueFromExisting,
  normalizeVariantsFormValue,
} from "@/core/modules/product/editor/model/product-variants";
import {
  buildProductModifierBindingsPayload,
  type ProductModifierGroupBindingDraft,
} from "@/core/modules/product-modifier";
import {
  buildProductPriceListBulkPricesPayload,
  buildProductPriceListProductSourceFromForm,
  type ProductPriceListPriceDraft,
  useCatalogPriceLists,
} from "@/core/modules/catalog-price-list";
import { buildPersistedEditableAttributeValues } from "@/core/widgets/edit-product-drawer/model/edit-product-drawer-data";
import { useEditProductDrawerState } from "@/core/widgets/edit-product-drawer/model/use-edit-product-drawer-state";
import { useEditProductImageEditor } from "@/core/widgets/edit-product-drawer/model/use-edit-product-image-editor";
import { useEditProductSubmit } from "@/core/widgets/edit-product-drawer/model/use-edit-product-submit";
import { invalidateProductQueries } from "@/core/modules/product/actions/model";
import {
  useProductControllerGetById,
  useProductControllerRemove,
  useProductControllerUpdate,
} from "@/shared/api/generated/react-query";
import { useCatalog } from "@/shared/providers/catalog-provider";
import {
  useCatalogCapabilities,
  useCatalogProductStructureVisibility,
} from "@/shared/capabilities/catalog-capabilities";
import { getCatalogPriceFormatMode } from "@/shared/lib/price-format";
import { confirmDelete } from "@/shared/ui/confirmation";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
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
  const catalog = useCatalog();
  const { type } = catalog;
  const priceFormatMode = getCatalogPriceFormatMode(catalog);
  const features = useCatalogCapabilities();
  const productStructure = useCatalogProductStructureVisibility(features);
  const queryClient = useQueryClient();
  const updateProduct = useProductControllerUpdate();
  const removeProduct = useProductControllerRemove();
  const form = useProductEditorForm();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [modifierDrafts, setModifierDrafts] = React.useState<
    ProductModifierGroupBindingDraft[]
  >([]);
  const [areModifierDraftsReady, setAreModifierDraftsReady] =
    React.useState(false);
  const [priceListPriceDrafts, setPriceListPriceDrafts] = React.useState<
    ProductPriceListPriceDraft[]
  >([]);
  const [hasPriceListPriceDraftsEdited, setHasPriceListPriceDraftsEdited] =
    React.useState(false);
  const [open, setOpen] = React.useState(false);
  const priceListsQuery = useCatalogPriceLists(
    {},
    { enabled: features.canUseCatalogPriceLists && open },
  );
  const hideBasePrices =
    features.canUseCatalogPriceLists && (priceListsQuery.data?.length ?? 0) > 0;

  const productQuery = useProductControllerGetById(productId, {
    query: {
      enabled: open && Boolean(productId),
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });
  const product = productQuery.data ?? null;
  const currentProductTypeId = product?.productType?.id ?? null;
  const isIntegratedLinkedProduct = isIntegratedProduct(product);
  const canEditProductStructure = !isIntegratedLinkedProduct;
  const canDeleteProduct = !isIntegratedLinkedProduct;
  const canUseProductDiscounts =
    canEditProductStructure && !productStructure.hideProductStructureControls;
  const canEditProductPrice =
    canEditProductStructure && !productStructure.hideProductStructureControls;
  const canEditProductModifiers =
    features.canUseCatalogModifiers && canEditProductStructure;
  const productTypeLockIntegrationName =
    getProductIntegrationProviderLabel(product);
  const restoredVariantMatrixKeyRef = React.useRef<string | null>(null);
  const hasManualProductTypeChangeRef = React.useRef(false);

  const handleProductTypeChange = React.useCallback(
    (nextProductTypeId: string | null) => {
      if (!productStructure.canUseProductTypes || !canEditProductStructure) {
        form.setValue("productTypeId", currentProductTypeId ?? undefined, {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: false,
        });
        hasManualProductTypeChangeRef.current = false;
        return;
      }

      hasManualProductTypeChangeRef.current =
        nextProductTypeId !== currentProductTypeId;
    },
    [
      currentProductTypeId,
      form,
      canEditProductStructure,
      productStructure.canUseProductTypes,
    ],
  );

  const shouldSkipSchemaDrivenReset = React.useCallback(
    () => hasManualProductTypeChangeRef.current,
    [],
  );

  React.useEffect(() => {
    hasManualProductTypeChangeRef.current = false;
  }, [productId]);

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
      !productStructure.canUseProductTypes || !canEditProductStructure,
    canUseProductTypes: productStructure.canUseProductTypes,
    canUseProductVariants:
      productStructure.canUseProductVariants && canEditProductStructure,
    canUseDiscounts: canUseProductDiscounts,
    canEditPrice: canEditProductPrice,
    canUseCatalogSaleUnits: features.canUseCatalogSaleUnits,
    hideBasePrices,
    isActive: open,
    supportsBrands,
    supportsCategoryDetails,
    showProductTypeField: canEditProductStructure,
    productTypeLockIntegrationName,
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
    priceFormatMode,
    canUseDiscounts: canUseProductDiscounts,
    variantAttributes,
    productQueryError: productQuery.error,
    productQueryIsError: productQuery.isError,
    resetFromMedia: imageEditor.resetFromMedia,
    setOpen,
    shouldSkipSchemaDrivenReset,
  });
  const {
    closeDrawer: closeBaseDrawer,
    errorMessage,
    handleOpenChange: handleBaseOpenChange,
    handleReset: handleBaseReset,
    open: drawerOpen,
    setErrorMessage,
  } = drawerState;
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

  const resetModifierDrafts = React.useCallback(() => {
    setModifierDrafts((current) => (current.length > 0 ? [] : current));
    setAreModifierDraftsReady((current) => (current ? false : current));
  }, []);
  const resetPriceListPriceDrafts = React.useCallback(() => {
    setPriceListPriceDrafts((current) => (current.length > 0 ? [] : current));
    setHasPriceListPriceDraftsEdited((current) => (current ? false : current));
  }, []);
  const markPriceListPriceDraftsEdited = React.useCallback(() => {
    setHasPriceListPriceDraftsEdited(true);
  }, []);

  const handleCloseDrawer = React.useCallback(() => {
    hasManualProductTypeChangeRef.current = false;
    resetModifierDrafts();
    resetPriceListPriceDrafts();
    closeBaseDrawer();
    onExternalOpenChange?.(false);
  }, [
    closeBaseDrawer,
    onExternalOpenChange,
    resetModifierDrafts,
    resetPriceListPriceDrafts,
  ]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      handleBaseOpenChange(nextOpen);
      if (!nextOpen) {
        resetModifierDrafts();
        resetPriceListPriceDrafts();
      }
    },
    [handleBaseOpenChange, resetModifierDrafts, resetPriceListPriceDrafts],
  );

  React.useEffect(() => {
    if (!open) {
      restoredVariantMatrixKeyRef.current = null;
      hasManualProductTypeChangeRef.current = false;
      resetModifierDrafts();
      resetPriceListPriceDrafts();
    }
  }, [open, resetModifierDrafts, resetPriceListPriceDrafts]);

  React.useEffect(() => {
    resetModifierDrafts();
    resetPriceListPriceDrafts();
  }, [productId, resetModifierDrafts, resetPriceListPriceDrafts]);

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
      priceFormatMode,
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
  }, [
    form,
    open,
    priceFormatMode,
    product,
    variantAttributes,
    variantMatrixRestoreKey,
  ]);

  const handleDelete = React.useCallback(() => {
    if (isBusy) {
      return;
    }

    if (!canDeleteProduct) {
      toast.error(
        "Товар управляется интеграцией и удаляется только через синхронизацию.",
      );
      return;
    }

    if (!product) {
      const message = getMissingProductMessage({
        error: productQuery.error,
        isError: productQuery.isError,
      });
      setErrorMessage(message);
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
        setErrorMessage(message);
        toast.error(message);
      },
    });
  }, [
    canDeleteProduct,
    handleCloseDrawer,
    isBusy,
    product,
    productQuery.error,
    productQuery.isError,
    queryClient,
    removeProduct,
    setErrorMessage,
  ]);

  const getModifierBindings = React.useCallback(() => {
    if (!areModifierDraftsReady) {
      throw new Error("Дождитесь загрузки модификаторов товара.");
    }

    return buildProductModifierBindingsPayload(modifierDrafts);
  }, [areModifierDraftsReady, modifierDrafts]);
  const getPriceListPrices = React.useCallback(
    (nextProduct?: typeof product) => {
      const formProduct = buildProductPriceListProductSourceFromForm({
        canUseCatalogSaleUnits: features.canUseCatalogSaleUnits,
        canUseProductVariants:
          productStructure.canUseProductVariants && canEditProductStructure,
        formValues: form.getValues(),
        product,
        variantAttributes,
      });

      return buildProductPriceListBulkPricesPayload(
        priceListPriceDrafts,
        priceFormatMode,
        {
          product: nextProduct ?? formProduct,
          previousProduct: formProduct,
        },
      );
    },
    [
      canEditProductStructure,
      features.canUseCatalogSaleUnits,
      form,
      priceFormatMode,
      priceListPriceDrafts,
      product,
      productStructure.canUseProductVariants,
      variantAttributes,
    ],
  );

  const handleBaseSubmit = useEditProductSubmit({
    closeDrawer: handleCloseDrawer,
    canUseCatalogSaleUnits: features.canUseCatalogSaleUnits,
    canUseProductTypes: productStructure.canUseProductTypes,
    canUseProductVariants:
      productStructure.canUseProductVariants && canEditProductStructure,
    canUseDiscounts: canUseProductDiscounts,
    canEditPrice: canEditProductPrice,
    form,
    getModifierBindings: canEditProductModifiers
      ? getModifierBindings
      : undefined,
    getPriceListPrices: features.canUseCatalogPriceLists
      ? getPriceListPrices
      : undefined,
    isInitialCropRequired: imageEditor.isInitialCropRequired,
    isSubmitting,
    openRequiredCropper: imageEditor.openRequiredCropper,
    pendingAddedFilesCount: imageEditor.pendingAddedFilesCount,
    persistedAttributeValues,
    priceFormatMode,
    product,
    productAttributes,
    productQueryError: productQuery.error,
    productQueryIsError: productQuery.isError,
    queryClient,
    resolveMediaIdsForSubmit: imageEditor.resolveMediaIdsForSubmit,
    setErrorMessage,
    setIsSubmitting,
    updateProduct,
    variantAttributes,
    visibleAttributes,
  });

  const handleSubmit = React.useCallback(() => {
    void handleBaseSubmit();
  }, [handleBaseSubmit]);

  const handleReset = React.useCallback(() => {
    hasManualProductTypeChangeRef.current = false;
    handleBaseReset();
    resetModifierDrafts();
    resetPriceListPriceDrafts();
  }, [handleBaseReset, resetModifierDrafts, resetPriceListPriceDrafts]);

  return {
    cropperApplyLabel: imageEditor.cropperApplyLabel,
    cropperDescription: imageEditor.cropperDescription,
    cropperFiles: imageEditor.cropperFiles,
    cropperInitialIndex: imageEditor.cropperInitialIndex,
    cropperMode: imageEditor.cropperMode,
    cropperTitle: imageEditor.cropperTitle,
    canDeleteProduct,
    errorMessage,
    features: {
      ...features,
      canUseProductTypes: productStructure.canUseProductTypes,
      canUseProductVariants:
        productStructure.canUseProductVariants && canEditProductStructure,
      canUseProductDiscounts,
      canEditProductPrice,
      canEditProductModifiers,
      hideBasePrices,
    },
    form,
    formFields,
    productAttributes,
    variantAttributes,
    handleCropApply: imageEditor.handleCropApply,
    handleCropperOpenChange: imageEditor.handleCropperOpenChange,
    handleEditItem: imageEditor.handleEditItem,
    handleFilesChange: imageEditor.handleFilesChange,
    handleDelete,
    handleOpenChange,
    handleReset,
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
    modifierDrafts,
    open: drawerOpen,
    pendingSwapIndex: imageEditor.pendingSwapIndex,
    priceListPriceDrafts,
    hasPriceListPriceDraftsEdited,
    markPriceListPriceDraftsEdited,
    product,
    removeItem: imageEditor.removeItem,
    uploadState: imageEditor.uploadState,
    uploadedMediaIds: imageEditor.uploadedMediaIds,
    setAreModifierDraftsReady,
    setModifierDrafts,
    setPriceListPriceDrafts,
  };
}
