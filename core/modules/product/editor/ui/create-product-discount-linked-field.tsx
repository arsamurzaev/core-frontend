"use client";

import { type CreateProductFormValues } from "@/core/modules/product/editor/model/form-config";
import { clamp } from "@/shared/lib/math";
import { cn, getCatalogCurrency } from "@/shared/lib/utils";
import { type DynamicFieldRenderProps } from "@/shared/ui/dynamic-form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/shared/ui/input-group";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { type Path } from "react-hook-form";
import React from "react";

type LinkedDiscountFieldMode = "discount" | "discounted-price";

interface CreateProductDiscountLinkedFieldProps
  extends DynamicFieldRenderProps<CreateProductFormValues> {
  mode: LinkedDiscountFieldMode;
  relatedAttributeId?: string;
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
  const { catalog } = useCatalogState();
  const suffix = mode === "discount" ? "%" : getCatalogCurrency(catalog, "₽");
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
    <InputGroup>
      <InputGroupInput
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
      <InputGroupAddon align="inline-end" aria-hidden>
        <InputGroupText className="min-w-5 justify-center">
          {suffix}
        </InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  );
}

