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

export function CreateProductBrandField<TValues extends FieldValues>({
  disabled,
  field,
  options,
  placeholder,
  readOnly,
}: DynamicFieldRenderProps<TValues>) {
  const [open, setOpen] = React.useState(false);
  const [draftValue, setDraftValue] = React.useState<string | null>(null);

  const isControlDisabled = disabled || readOnly;
  const optionList = options ?? EMPTY_OPTIONS;
  const selectedValue =
    field.value === undefined || field.value === null ? "" : String(field.value);

  const selectedOption = React.useMemo(
    () =>
      optionList.find((option) => String(option.value) === selectedValue) ?? null,
    [optionList, selectedValue],
  );

  const openDrawer = React.useCallback(() => {
    if (isControlDisabled) {
      return;
    }

    setDraftValue(selectedValue || null);
    setOpen(true);
  }, [isControlDisabled, selectedValue]);

  const hasChanges = (draftValue ?? "") !== selectedValue;

  const handleApply = React.useCallback(() => {
    field.onChange(draftValue ?? undefined);
    field.onBlur();
    setOpen(false);
  }, [draftValue, field]);

  return (
    <>
      <div className="w-full border-b text-muted-foreground">
        {selectedOption ? (
          <div className="flex items-center justify-between gap-2 pb-4">
            <button
              type="button"
              className="flex min-w-0 items-center gap-1 text-black"
              onClick={openDrawer}
              disabled={isControlDisabled}
            >
              <span className="truncate">{getOptionText(selectedOption)}</span>
              <ChevronRight className="size-4 shrink-0" />
            </button>

            <button
              type="button"
              className="text-muted transition-colors hover:text-foreground disabled:opacity-50"
              onClick={(event) => {
                event.stopPropagation();
                field.onChange(undefined);
                field.onBlur();
              }}
              disabled={isControlDisabled}
              aria-label="Очистить бренд"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="flex w-full items-center gap-1 pb-4 text-left"
            onClick={openDrawer}
            disabled={isControlDisabled}
          >
            <span>{placeholder ?? "Выбрать бренд"}</span>
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
            title="Выбор бренда"
            description="Укажите бренд или добавьте новый. Это нужно для того, чтобы пользователи легче могли найти товар или услугу по своему запросу в фильтрах."
          />

          <div className="overflow-y-auto">
            <hr />
            <DrawerScrollArea className="px-5 py-7">
              <div className="grid grid-cols-[90px_1fr] gap-3">
                <h2>Выбрать бренд:</h2>
                <ul className="space-y-5">
                  {optionList.length === 0 ? (
                    <li className="text-sm text-muted-foreground">
                      Список брендов пуст.
                    </li>
                  ) : (
                    optionList.map((option) => {
                      const optionValue = String(option.value);
                      const isSelected = optionValue === (draftValue ?? "");

                      return (
                        <li key={optionValue}>
                          <button
                            type="button"
                            disabled={isControlDisabled || option.disabled}
                            onClick={() =>
                              setDraftValue((prev) =>
                                prev === optionValue ? null : optionValue,
                              )
                            }
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
