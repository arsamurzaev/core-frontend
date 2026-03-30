"use client";

import {
  buildCatalogEditFormDefaultValues,
  catalogEditFormResolver,
  type CatalogEditFormValues,
} from "@/core/widgets/edit-catalog-drawer/model/form-config";
import { useEditCatalogDrawerState } from "@/core/widgets/edit-catalog-drawer/model/use-edit-catalog-drawer-state";
import { useEditCatalogSubmit } from "@/core/widgets/edit-catalog-drawer/model/use-edit-catalog-submit";
import { useCatalogControllerUpdateCurrent } from "@/shared/api/generated/react-query";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";

interface UseEditCatalogDrawerParams {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function useEditCatalogDrawer(params: UseEditCatalogDrawerParams = {}) {
  const { open, onOpenChange } = params;
  const catalog = useCatalog();
  const queryClient = useQueryClient();
  const router = useRouter();
  const updateCatalog = useCatalogControllerUpdateCurrent();
  const defaultValues = React.useMemo(
    () => buildCatalogEditFormDefaultValues(catalog),
    [catalog],
  );
  const form = useForm<CatalogEditFormValues>({
    defaultValues,
    resolver: catalogEditFormResolver,
    mode: "onChange",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const state = useEditCatalogDrawerState({
    defaultValues,
    form,
    isSubmitting,
    open,
    onOpenChange,
  });
  const handleSubmit = useEditCatalogSubmit({
    catalogId: catalog.id,
    closeDrawer: state.closeDrawer,
    form,
    isSubmitting,
    queryClient,
    resetFeedback: state.resetFeedback,
    router,
    setErrorMessage: state.setErrorMessage,
    setIsSubmitting,
    setUploadState: state.setUploadState,
    updateCatalog,
  });

  return {
    bgUrl: catalog.config?.bgMedia?.url,
    errorMessage: state.errorMessage,
    form,
    handleOpenChange: state.handleOpenChange,
    handleSubmit,
    isSubmitting,
    logoUrl: catalog.config?.logoMedia?.url,
    open: state.open,
    uploadState: state.uploadState,
  };
}
