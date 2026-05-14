"use client";

import type { CreateProductFormValues } from "@/core/modules/product/editor/model/form-config";
import type { DynamicFieldRenderProps } from "@/shared/ui/dynamic-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import React from "react";

const EMPTY_PRODUCT_TYPE_VALUE = "__product_type_empty__";

export type ProductTypeSelectFieldProps =
  DynamicFieldRenderProps<CreateProductFormValues> & {
    onProductTypeChange: (productTypeId: string | null) => void;
  };

export function ProductTypeSelectField({
  disabled,
  field,
  fieldConfig,
  id,
  onProductTypeChange,
  options,
  placeholder,
  readOnly,
  required,
}: ProductTypeSelectFieldProps) {
  const value =
    field.value === undefined || field.value === null || field.value === ""
      ? EMPTY_PRODUCT_TYPE_VALUE
      : String(field.value);

  return (
    <Select
      value={value}
      disabled={disabled || readOnly}
      onValueChange={(nextValue) => {
        const resolvedValue =
          nextValue === EMPTY_PRODUCT_TYPE_VALUE ? "" : nextValue;

        field.onChange(resolvedValue);
        onProductTypeChange(resolvedValue || null);
      }}
    >
      <SelectTrigger
        id={id}
        onBlur={field.onBlur}
        className={fieldConfig.controlClassName}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        sideOffset={4}
        collisionPadding={8}
      >
        {!required && placeholder ? (
          <SelectItem value={EMPTY_PRODUCT_TYPE_VALUE}>
            {placeholder}
          </SelectItem>
        ) : null}

        {(options ?? []).map((option) => (
          <SelectItem
            key={String(option.value)}
            value={String(option.value)}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
