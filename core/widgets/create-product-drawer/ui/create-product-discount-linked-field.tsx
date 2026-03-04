"use client";

import { type CreateProductFormValues } from "@/core/widgets/create-product-drawer/model/form-config";
import { cn } from "@/shared/lib/utils";
import { type DynamicFieldRenderProps } from "@/shared/ui/dynamic-form";
import { Input } from "@/shared/ui/input";
import { type Path } from "react-hook-form";
import React from "react";

type LinkedDiscountFieldMode = "discount" | "discounted-price";

interface CreateProductDiscountLinkedFieldProps
  extends DynamicFieldRenderProps<CreateProductFormValues> {
  mode: LinkedDiscountFieldMode;
  relatedAttributeId?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toInputValue(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value);
}

function setRelatedDiscountValue(
  mode: LinkedDiscountFieldMode,
  price: number,
  value: number,
): string | null {
  if (!price || Number.isNaN(price) || Number.isNaN(value)) {
    return null;
  }

  if (mode === "discount") {
    const percent = clamp(Math.round(value), 0, 100);
    const discounted = Math.round((price * (100 - percent)) / 100);
    return String(discounted);
  }

  const raw = Math.round(((price - value) / price) * 100);
  const clamped = clamp(raw, 0, 100);
  return String(clamped);
}

export function CreateProductDiscountLinkedField({
  field: controllerField,
  fieldConfig,
  form,
  id,
  mode,
  placeholder,
  disabled,
  readOnly,
  relatedAttributeId,
}: CreateProductDiscountLinkedFieldProps) {
  const relatedFieldName = React.useMemo<Path<CreateProductFormValues> | null>(
    () =>
      relatedAttributeId
        ? (`attributes.${relatedAttributeId}` as Path<CreateProductFormValues>)
        : null,
    [relatedAttributeId],
  );

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const value = Number(rawValue);
      const price = Number(form.getValues("price"));

      if (relatedFieldName) {
        const relatedValue = setRelatedDiscountValue(mode, price, value);
        form.setValue(relatedFieldName, relatedValue, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }

      controllerField.onChange(rawValue);
    },
    [controllerField, form, mode, relatedFieldName],
  );

  const inputProps = fieldConfig.inputProps ?? {};

  return (
    <Input
      id={id}
      type={typeof inputProps.type === "string" ? inputProps.type : "number"}
      value={toInputValue(controllerField.value)}
      onChange={handleChange}
      onBlur={controllerField.onBlur}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
      min={fieldConfig.min}
      max={fieldConfig.max}
      step={fieldConfig.step}
      minLength={fieldConfig.minLength}
      maxLength={fieldConfig.maxLength}
      className={cn("text-center", fieldConfig.controlClassName)}
      {...inputProps}
    />
  );
}
