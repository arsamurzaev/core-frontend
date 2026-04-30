"use client";

import { type CreateProductFormValues } from "@/core/modules/product/editor/model/form-config";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { type DynamicFieldRenderProps } from "@/shared/ui/dynamic-form";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, Trash2, X } from "lucide-react";
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
  const [draftRange, setDraftRange] = React.useState<DateRange | undefined>(
    undefined,
  );

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

  React.useEffect(() => {
    if (open) {
      setDraftRange(range);
    }
  }, [open, range]);

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
      setDraftRange(nextRange);
    },
    [],
  );

  const handleSave = React.useCallback(() => {
    setRangeValue(draftRange);
    setOpen(false);
  }, [draftRange, setRangeValue]);

  const handleClose = React.useCallback(() => {
    setDraftRange(range);
    setOpen(false);
  }, [range]);

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
        <PopoverContent
          className="w-auto p-0"
          align="start"
          onInteractOutside={(event) => {
            event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            event.preventDefault();
          }}
        >
          <div className="flex items-center justify-between border-b px-3 py-2">
            <p className="text-sm font-medium">Период скидки</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-full"
              onClick={handleClose}
              aria-label="Закрыть"
            >
              <X className="size-4" />
            </Button>
          </div>
          <Calendar
            locale={ru}
            mode="range"
            defaultMonth={draftRange?.from ?? range?.from}
            selected={draftRange}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
          <div className="flex justify-end gap-2 border-t px-3 py-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDraftRange(undefined)}
            >
              Очистить
            </Button>
            <Button type="button" size="sm" onClick={handleSave}>
              Сохранить
            </Button>
          </div>
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

