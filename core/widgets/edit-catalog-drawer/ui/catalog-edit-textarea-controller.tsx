"use client";

import { type CatalogEditFormValues } from "@/core/widgets/edit-catalog-drawer/model/form-config";
import { CharacterLimitedTextarea } from "@/shared/ui/character-limited-textarea";
import { FieldError } from "@/shared/ui/field";
import React from "react";
import {
  Controller,
  type FieldError as RhfFieldError,
  type UseFormReturn,
} from "react-hook-form";

type CatalogEditTextareaFieldName = "name" | "about" | "description";

export type CatalogEditTextareaControllerConfig = {
  label: string;
  maxLength: number;
  minRows: number;
  name: CatalogEditTextareaFieldName;
  placeholder: string;
  required?: boolean;
};

type CatalogEditTextRowProps = {
  children: React.ReactNode;
  error?: RhfFieldError;
  label: string;
  required?: boolean;
};

type CatalogEditTextareaControllerProps = {
  config: CatalogEditTextareaControllerConfig;
  disabled?: boolean;
  form: UseFormReturn<CatalogEditFormValues>;
};

function CatalogEditTextRow({
  children,
  error,
  label,
  required = false,
}: CatalogEditTextRowProps) {
  return (
    <div className="grid w-full grid-cols-[100px_minmax(0,1fr)] gap-x-5 gap-y-2 px-5 sm:grid-cols-[180px_minmax(0,1fr)]">
      <div className="pt-1 text-sm leading-6">
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </div>
      <div className="min-w-0">{children}</div>
      {error?.message ? (
        <FieldError className="col-start-2">{error.message}</FieldError>
      ) : null}
    </div>
  );
}

export const CatalogEditTextareaController: React.FC<
  CatalogEditTextareaControllerProps
> = ({ config, disabled = false, form }) => {
  return (
    <Controller
      control={form.control}
      name={config.name}
      render={({ field, fieldState }) => (
        <CatalogEditTextRow
          label={config.label}
          required={config.required}
          error={fieldState.error}
        >
          <CharacterLimitedTextarea
            ref={field.ref}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            maxLength={config.maxLength}
            minRows={config.minRows}
            placeholder={config.placeholder}
            disabled={disabled}
          />
        </CatalogEditTextRow>
      )}
    />
  );
};
