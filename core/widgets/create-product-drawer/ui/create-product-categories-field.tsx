"use client";

import { cn } from "@/shared/lib/utils";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import {
  type DynamicFieldRenderProps,
  type FieldOption,
} from "@/shared/ui/dynamic-form";
import { ChevronRight, Trash2 } from "lucide-react";
import { type FieldValues } from "react-hook-form";
import React from "react";

const EMPTY_OPTIONS: FieldOption[] = [];

function getOptionText(option: FieldOption): string {
  return typeof option.label === "string"
    ? option.label
    : typeof option.value === "string"
      ? option.value
      : String(option.value);
}

function areStringSetsEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const leftSet = new Set(left);
  for (const item of right) {
    if (!leftSet.has(item)) {
      return false;
    }
  }

  return true;
}

export function CreateProductCategoriesField<TValues extends FieldValues>({
  disabled,
  field,
  options,
  placeholder,
  readOnly,
}: DynamicFieldRenderProps<TValues>) {
  const [open, setOpen] = React.useState(false);
  const [draftValues, setDraftValues] = React.useState<string[]>([]);

  const isControlDisabled = disabled || readOnly;
  const optionList = options ?? EMPTY_OPTIONS;
  const selectedValues = React.useMemo(
    () =>
      Array.isArray(field.value)
        ? field.value.map((value) => String(value))
        : [],
    [field.value],
  );

  const selectedValueSet = React.useMemo(
    () => new Set(selectedValues),
    [selectedValues],
  );

  const selectedOptions = React.useMemo(
    () =>
      optionList.filter((option) => selectedValueSet.has(String(option.value))),
    [optionList, selectedValueSet],
  );

  const openDrawer = React.useCallback(() => {
    if (isControlDisabled) {
      return;
    }

    setDraftValues(selectedValues);
    setOpen(true);
  }, [isControlDisabled, selectedValues]);

  const toggleDraftValue = React.useCallback((value: string) => {
    setDraftValues((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  }, []);

  const hasChanges = !areStringSetsEqual(draftValues, selectedValues);

  const handleApply = React.useCallback(() => {
    field.onChange(draftValues);
    field.onBlur();
    setOpen(false);
  }, [draftValues, field]);

  return (
    <>
      <div className="w-full border-b text-muted-foreground">
        {selectedOptions.length > 0 ? (
          selectedOptions.map((option) => {
            const optionValue = String(option.value);

            return (
              <div key={optionValue} className="w-full text-black">
                <div className="flex items-center justify-between gap-2 pb-4">
                  <button
                    type="button"
                    className="flex min-w-0 items-center gap-1"
                    onClick={openDrawer}
                    disabled={isControlDisabled}
                  >
                    <span className="truncate">{getOptionText(option)}</span>
                    <ChevronRight className="size-4 shrink-0" />
                  </button>

                  <button
                    type="button"
                    className="text-muted transition-colors hover:text-foreground disabled:opacity-50"
                    onClick={(event) => {
                      event.stopPropagation();
                      field.onChange(
                        selectedValues.filter((item) => item !== optionValue),
                      );
                      field.onBlur();
                    }}
                    disabled={isControlDisabled}
                    aria-label={`Удалить категорию ${getOptionText(option)}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <hr />
              </div>
            );
          })
        ) : (
          <button
            type="button"
            className="flex w-full items-center gap-1 pb-4 text-left"
            onClick={openDrawer}
            disabled={isControlDisabled}
          >
            <span>{placeholder ?? "Выбрать категорию"}</span>
            <ChevronRight className="size-4 shrink-0" />
          </button>
        )}
      </div>

      <AppDrawer
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            field.onBlur();
          }
        }}
        dismissible={!isControlDisabled}
      >
        <AppDrawer.Content className="mx-auto w-full max-w-md">
          <AppDrawer.Header
            title="Выбор категории"
            description="Укажите категорию или добавьте новую. Это нужно для того, чтобы пользователи легче могли найти товар или услугу по своему запросу в фильтрах."
          />

          <div className="overflow-y-auto">
            <hr />
            <DrawerScrollArea className="px-5 py-7">
              <div className="grid grid-cols-[90px_1fr] gap-3">
                <h2>Выбрать категорию:</h2>
                <ul className="space-y-5">
                  {optionList.length === 0 ? (
                    <li className="text-sm text-muted-foreground">
                      Список категорий пуст.
                    </li>
                  ) : (
                    optionList.map((option) => {
                      const optionValue = String(option.value);
                      const isSelected = draftValues.includes(optionValue);

                      return (
                        <li key={optionValue}>
                          <button
                            type="button"
                            disabled={isControlDisabled || option.disabled}
                            onClick={() => toggleDraftValue(optionValue)}
                            className={cn(
                              "w-full text-left transition-colors",
                              isSelected ? "text-black" : "text-muted-foreground",
                            )}
                          >
                            {option.label}
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            </DrawerScrollArea>
          </div>

          <AppDrawer.Footer
            className="border-t"
            isAutoClose={false}
            isFooterBtnDisabled={!hasChanges || isControlDisabled}
            btnText="Сохранить изменения"
            buttonType="button"
            handleClick={handleApply}
          />
        </AppDrawer.Content>
      </AppDrawer>
    </>
  );
}
