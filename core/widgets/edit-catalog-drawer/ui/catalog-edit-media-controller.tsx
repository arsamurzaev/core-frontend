"use client";

import { type CatalogEditFormValues } from "@/core/widgets/edit-catalog-drawer/model/form-config";
import { CatalogEditMediaField } from "@/core/widgets/edit-catalog-drawer/ui/catalog-edit-media-field";
import React from "react";
import { Controller, type UseFormReturn } from "react-hook-form";

type CatalogEditMediaFieldName = "logoFile" | "bgFile";

export type CatalogEditMediaControllerConfig = {
  name: CatalogEditMediaFieldName;
  existingUrl?: string | null;
} & Omit<
  React.ComponentProps<typeof CatalogEditMediaField>,
  "field" | "disabled" | "existingUrl"
>;

type CatalogEditMediaControllerProps = {
  config: CatalogEditMediaControllerConfig;
  disabled?: boolean;
  form: UseFormReturn<CatalogEditFormValues>;
};

export const CatalogEditMediaController: React.FC<
  CatalogEditMediaControllerProps
> = ({ config, disabled = false, form }) => {
  const { existingUrl, name, ...fieldProps } = config;

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <CatalogEditMediaField
          field={field}
          disabled={disabled}
          existingUrl={existingUrl}
          {...fieldProps}
        />
      )}
    />
  );
};
