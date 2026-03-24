"use client";

import { type CreateProductFormValues } from "@/core/modules/product/editor/model/form-config";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { type DynamicFieldRenderProps } from "@/shared/ui/dynamic-form";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, Trash2 } from "lucide-react";
import { type Path, useWatch } from "react-hook-form";
import { type DateRange } from "react-day-picker";
import React from "react";

interface CreateProductDiscountDateRangeFieldProps
  extends DynamicFieldRenderProps<CreateProductFormValues> {
  relatedAttributeId: string;
}

function parseAttributeDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatDateRangeLabel(range: DateRange | undefined): string {
  if (!range?.from) {
    return "Выберите дату";
  }

  if (!range.to) {
    return format(range.from, "d.MM.yy", { locale: ru });
  }

  return `${format(range.from, "d.MM.yy", { locale: ru })} - ${format(range.to, "d.MM.yy", { locale: ru })}`;
}

function toAttributeDateValue(date: Date | undefined): string | null {
  return date ? date.toISOString() : null;
}

export function CreateProductDiscountDateRangeField({
  field: controllerField,
  fieldConfig,
  form,
  id,
  disabled,
  readOnly,
  relatedAttributeId,
}: CreateProductDiscountDateRangeFieldProps) {
  const [open, setOpen] = React.useState(false);

  const relatedFieldName = React.useMemo<Path<CreateProductFormValues>>(
    () => `attributes.${relatedAttributeId}` as Path<CreateProductFormValues>,
    [relatedAttributeId],
  );

  const relatedFieldValue = useWatch({
    control: form.control,
    name: relatedFieldName,
  });

  const range = React.useMemo<DateRange | undefined>(() => {
    const from = parseAttributeDate(controllerField.value);
    const to = parseAttributeDate(relatedFieldValue);

    if (!from && !to) {
      return undefined;
    }

    return { from, to };
  }, [controllerField.value, relatedFieldValue]);

  const setRangeValue = React.useCallback(
    (nextRange: DateRange | undefined) => {
      form.setValue(
        controllerField.name as Path<CreateProductFormValues>,
        toAttributeDateValue(nextRange?.from),
        {
          shouldDirty: true,
          shouldTouch: true,
        },
      );
      form.setValue(relatedFieldName, toAttributeDateValue(nextRange?.to), {
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [controllerField.name, form, relatedFieldName],
  );

  const handleSelect = React.useCallback(
    (nextRange: DateRange | undefined) => {
      setRangeValue(nextRange);

      if (nextRange?.from && nextRange.to) {
        setOpen(false);
      }
    },
    [setRangeValue],
  );

  const handleClear = React.useCallback(() => {
    setRangeValue(undefined);
  }, [setRangeValue]);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled || readOnly}
            className={cn(
              "min-w-0 flex-1 justify-start text-left font-normal",
              !range && "text-muted-foreground",
              fieldConfig.controlClassName,
            )}
          >
            <CalendarIcon className="size-4" />
            <span className="truncate">{formatDateRangeLabel(range)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            locale={ru}
            mode="range"
            defaultMonth={range?.from}
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled || readOnly || !range}
        onClick={handleClear}
        aria-label="Очистить даты скидки"
        className="shrink-0"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

