"use client";

import { useProductFormFields } from "@/core/modules/product/editor/model/use-product-form-fields";
import { useProductEditorForm } from "@/core/modules/product/editor/model/use-product-editor-form";
import { useProductImageEditor } from "@/core/modules/product/editor/model/use-product-image-editor";
import {
  buildProductModifierBindingsPayload,
  type ProductModifierGroupBindingDraft,
} from "@/core/modules/product-modifier";
import {
  buildCreateProductPriceListPricesPayload,
  type CreateProductPriceListPriceDraft,
  useCatalogPriceLists,
} from "@/core/modules/catalog-price-list";
import { useCreateProductDrawerState } from "@/core/widgets/create-product-drawer/model/use-create-product-drawer-state";
import { useCreateProductSubmit } from "@/core/widgets/create-product-drawer/model/use-create-product-submit";
import { useProductControllerCreate } from "@/shared/api/generated/react-query";
import {
  useCatalogCapabilities,
  useCatalogProductStructureVisibility,
} from "@/shared/capabilities/catalog-capabilities";
import { getCatalogPriceFormatMode } from "@/shared/lib/price-format";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";

interface UseCreateProductDrawerParams {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  supportsBrands?: boolean;
  supportsCategoryDetails?: boolean;
}

export function useCreateProductDrawer(
  params: UseCreateProductDrawerParams = {},
) {
  const {
    open: controlledOpen,
    onOpenChange,
    supportsBrands = true,
    supportsCategoryDetails = true,
  } = params;
  const catalog = useCatalog();
  const { type } = catalog;
  const priceFormatMode = getCatalogPriceFormatMode(catalog);
  const features = useCatalogCapabilities();
  const productStructure = useCatalogProductStructureVisibility(features);
  const canUseProductDiscounts = !productStructure.hideProductStructureControls;
  const canEditProductPrice = !productStructure.hideProductStructureControls;
  const queryClient = useQueryClient();
  const createProduct = useProductControllerCreate();
  const form = useProductEditorForm();
  const [modifierDrafts, setModifierDrafts] = React.useState<
    ProductModifierGroupBindingDraft[]
  >([]);
  const [priceListPriceDrafts, setPriceListPriceDrafts] = React.useState<
    CreateProductPriceListPriceDraft[]
  >([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const priceListsQuery = useCatalogPriceLists(
    {},
    { enabled: features.canUseCatalogPriceLists && open },
  );
  const hideBasePrices =
    features.canUseCatalogPriceLists && (priceListsQuery.data?.length ?? 0) > 0;
  const setOpen = React.useCallback(
    (nextOpen: boolean | ((currentOpen: boolean) => boolean)) => {
      const resolvedOpen =
        typeof nextOpen === "function" ? nextOpen(open) : nextOpen;

      if (controlledOpen === undefined) {
        setUncontrolledOpen(resolvedOpen);
      }

      onOpenChange?.(resolvedOpen);
    },
    [controlledOpen, onOpenChange, open],
  );

  const {
    formFields,
    isProductTypeSchemaResolving,
    productAttributes,
    variantAttributes,
    visibleAttributes,
  } = useProductFormFields({
    form,
    sourceAttributes: type.attributes,
    canUseProductTypes: productStructure.canUseProductTypes,
    canUseProductVariants: productStructure.canUseProductVariants,
    canUseDiscounts: canUseProductDiscounts,
    canEditPrice: canEditProductPrice,
    canUseCatalogSaleUnits: features.canUseCatalogSaleUnits,
    hideBasePrices,
    isActive: open,
    supportsBrands,
    supportsCategoryDetails,
  });

  const imageEditor = useProductImageEditor({ isSubmitting });

  const drawerState = useCreateProductDrawerState({
    form,
    isSubmitting: isSubmitting || isProductTypeSchemaResolving,
    open,
    productAttributes,
    resetImageState: imageEditor.resetState,
    setOpen,
  });
  const {
    closeDrawer: closeBaseDrawer,
    errorMessage,
    handleOpenChange: handleBaseOpenChange,
    handleReset: handleBaseReset,
    open: drawerOpen,
    setErrorMessage,
  } = drawerState;
  const resetModifierDrafts = React.useCallback(() => {
    setModifierDrafts((current) => (current.length > 0 ? [] : current));
  }, []);
  const resetPriceListPriceDrafts = React.useCallback(() => {
    setPriceListPriceDrafts((current) => (current.length > 0 ? [] : current));
  }, []);
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
  const handleReset = React.useCallback(() => {
    handleBaseReset();
    resetModifierDrafts();
    resetPriceListPriceDrafts();
  }, [handleBaseReset, resetModifierDrafts, resetPriceListPriceDrafts]);
  const closeDrawer = React.useCallback(() => {
    closeBaseDrawer();
    resetModifierDrafts();
    resetPriceListPriceDrafts();
  }, [closeBaseDrawer, resetModifierDrafts, resetPriceListPriceDrafts]);
  const getModifierBindings = React.useCallback(
    () => buildProductModifierBindingsPayload(modifierDrafts),
    [modifierDrafts],
  );
  const getPriceListPrices = React.useCallback(
    () =>
      buildCreateProductPriceListPricesPayload(
        priceListPriceDrafts,
        priceFormatMode,
      ),
    [priceFormatMode, priceListPriceDrafts],
  );

  const handleSubmit = useCreateProductSubmit({
    closeDrawer,
    canUseCatalogSaleUnits: features.canUseCatalogSaleUnits,
    canUseProductTypes: productStructure.canUseProductTypes,
    canUseProductVariants: productStructure.canUseProductVariants,
    canUseDiscounts: canUseProductDiscounts,
    canEditPrice: canEditProductPrice,
    createProduct,
    files: imageEditor.files,
    form,
    getModifierBindings: features.canUseCatalogModifiers
      ? getModifierBindings
      : undefined,
    getPriceListPrices: features.canUseCatalogPriceLists
      ? getPriceListPrices
      : undefined,
    isInitialCropRequired: imageEditor.isInitialCropRequired,
    isSubmitting,
    openRequiredCropper: imageEditor.openRequiredCropper,
    pendingAddedFilesCount: imageEditor.pendingAddedFilesCount,
    priceFormatMode,
    productAttributes,
    queryClient,
    setErrorMessage,
    setIsSubmitting,
    uploadedMediaIds: imageEditor.uploadedMediaIds,
    variantAttributes,
    visibleAttributes,
  });

  return {
    cropperApplyLabel: imageEditor.cropperApplyLabel,
    cropperDescription: imageEditor.cropperDescription,
    cropperFiles: imageEditor.cropperFiles,
    cropperInitialIndex: imageEditor.cropperInitialIndex,
    cropperMode: imageEditor.cropperMode,
    cropperTitle: imageEditor.cropperTitle,
    errorMessage,
    filePreviewByFile: imageEditor.filePreviewByFile,
    files: imageEditor.files,
    form,
    formFields,
    features: {
      ...features,
      canUseProductTypes: productStructure.canUseProductTypes,
      canUseProductVariants: productStructure.canUseProductVariants,
      canUseProductDiscounts,
      canEditProductPrice,
      hideBasePrices,
    },
    productAttributes,
    variantAttributes,
    handleCropApply: imageEditor.handleCropApply,
    handleCropperOpenChange: imageEditor.handleCropperOpenChange,
    handleEditFile: imageEditor.handleEditFile,
    handleFilesChange: imageEditor.handleFilesChange,
    handleOpenChange,
    handleReset,
    handleSelectFileForSwap: imageEditor.handleSelectFileForSwap,
    handleSubmit,
    handleToggleReorderMode: imageEditor.handleToggleReorderMode,
    isCropperOpen: imageEditor.isCropperOpen,
    isInitialCropRequired: imageEditor.isInitialCropRequired,
    isReorderMode: imageEditor.isReorderMode,
    isSubmitting,
    isProductTypeSchemaResolving,
    modifierDrafts,
    open: drawerOpen,
    pendingSwapIndex: imageEditor.pendingSwapIndex,
    priceFormatMode,
    priceListPriceDrafts,
    removeFile: imageEditor.removeFile,
    uploadState: imageEditor.uploadState,
    uploadedMediaIds: imageEditor.uploadedMediaIds,
    setModifierDrafts,
    setPriceListPriceDrafts,
  };
}
