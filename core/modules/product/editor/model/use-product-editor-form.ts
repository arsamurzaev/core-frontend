"use client";

import {
  createProductEditorFormDefaultValues,
  type CreateProductFormValues,
} from "@/core/modules/product/editor/model/form-config";
import { useForm, type UseFormReturn } from "react-hook-form";

export function useProductEditorForm(): UseFormReturn<CreateProductFormValues> {
  return useForm<CreateProductFormValues>({
    defaultValues: createProductEditorFormDefaultValues(),
  });
}
