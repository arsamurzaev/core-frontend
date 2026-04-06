"use client";

import {
  nextVariantStatus,
  type VariantItemFormValue,
  type VariantStatus,
  type VariantsFormValue,
} from "@/core/modules/product/editor/model/product-variants";
import { type CreateProductFormValues } from "@/core/modules/product/editor/model/form-config";
import { type AttributeDto } from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import React from "react";
import { type UseFormReturn } from "react-hook-form";

interface ProductVariantsFieldProps {
  disabled?: boolean;
  form: UseFormReturn<CreateProductFormValues>;
  variantAttributes: AttributeDto[];
}

const STATUS_LABEL: Record<VariantStatus, string> = {
  DISABLED: "Откл.",
  ACTIVE: "В наличии",
  OUT_OF_STOCK: "Нет в наличии",
};

const STATUS_CLASS: Record<VariantStatus, string> = {
  DISABLED: "border-border bg-background text-muted-foreground hover:bg-muted",
  ACTIVE: "border-green-500 bg-green-50 text-green-700 hover:bg-green-100",
  OUT_OF_STOCK: "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100",
};

export const ProductVariantsField: React.FC<ProductVariantsFieldProps> = ({
  disabled,
  form,
  variantAttributes,
}) => {
  const [selectedAttributeId, setSelectedAttributeId] = React.useState<string>(
    () => variantAttributes[0]?.id ?? "",
  );

  React.useEffect(() => {
    if (selectedAttributeId || variantAttributes.length === 0) {
      return;
    }
    setSelectedAttributeId(variantAttributes[0].id);
  }, [selectedAttributeId, variantAttributes]);

  const variants = form.watch("variants") as VariantsFormValue | undefined;

  const selectedAttribute = React.useMemo(
    () => variantAttributes.find((a) => a.id === selectedAttributeId) ?? null,
    [selectedAttributeId, variantAttributes],
  );

  const enumValues = selectedAttribute?.enumValues ?? [];

  const getItem = React.useCallback(
    (enumValueId: string): VariantItemFormValue => {
      return (
        variants?.[selectedAttributeId]?.[enumValueId] ?? {
          status: "DISABLED",
          stock: 0,
        }
      );
    },
    [selectedAttributeId, variants],
  );

  const setItem = React.useCallback(
    (enumValueId: string, next: VariantItemFormValue) => {
      const current = (form.getValues("variants") as VariantsFormValue | undefined) ?? {};
      form.setValue(
        "variants",
        {
          ...current,
          [selectedAttributeId]: {
            ...(current[selectedAttributeId] ?? {}),
            [enumValueId]: next,
          },
        },
        { shouldDirty: true },
      );
    },
    [form, selectedAttributeId],
  );

  const handleToggle = React.useCallback(
    (enumValueId: string) => {
      const item = getItem(enumValueId);
      const nextStatus = nextVariantStatus(item.status);
      setItem(enumValueId, { status: nextStatus, stock: item.stock });
    },
    [getItem, setItem],
  );

  const handleStockChange = React.useCallback(
    (enumValueId: string, value: string) => {
      const item = getItem(enumValueId);
      const parsed = parseInt(value, 10);
      setItem(enumValueId, {
        ...item,
        stock: isNaN(parsed) || parsed < 0 ? 0 : parsed,
      });
    },
    [getItem, setItem],
  );

  if (variantAttributes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-sm font-medium text-muted-foreground min-w-[100px] sm:min-w-[200px]">
          Варианты
        </span>

        <Select
          value={selectedAttributeId}
          onValueChange={setSelectedAttributeId}
          disabled={disabled}
        >
          <SelectTrigger className="h-9 min-w-0 flex-1">
            <SelectValue placeholder="Выбрать атрибут" />
          </SelectTrigger>
          <SelectContent>
            {variantAttributes.map((attribute) => (
              <SelectItem key={attribute.id} value={attribute.id}>
                {attribute.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedAttribute && enumValues.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-[100px] sm:pl-[200px]">
          {enumValues.map((enumValue) => {
            const item = getItem(enumValue.id);
            const label = enumValue.displayName || enumValue.value;

            return (
              <div key={enumValue.id} className="flex flex-col gap-1">
                <button
                  type="button"
                  disabled={disabled}
                  title={STATUS_LABEL[item.status]}
                  onClick={() => handleToggle(enumValue.id)}
                  className={cn(
                    "h-8 w-13 rounded-md border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    STATUS_CLASS[item.status],
                  )}
                >
                  {label}
                </button>

                {item.status === "ACTIVE" && (
                  <input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={item.stock === 0 ? "" : item.stock}
                    placeholder="0"
                    disabled={disabled}
                    onChange={(e) => handleStockChange(enumValue.id, e.target.value)}
                    className="h-8 w-13 rounded-md border border-input bg-background px-2 text-center text-sm disabled:opacity-50"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
