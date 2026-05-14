"use client";

import { type AttributeDto } from "@/shared/api/generated/react-query";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Plus } from "lucide-react";
import React from "react";

interface ProductVariantAttributeSelectorProps {
  attributeToAddId: string;
  availableAttributes: AttributeDto[];
  disabled?: boolean;
  onAdd: () => void;
  onAttributeChange: (attributeId: string) => void;
}

export const ProductVariantAttributeSelector: React.FC<
  ProductVariantAttributeSelectorProps
> = ({
  attributeToAddId,
  availableAttributes,
  disabled,
  onAdd,
  onAttributeChange,
}) => {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <span className="shrink-0 text-sm font-medium text-muted-foreground sm:min-w-[200px]">
        Варианты
      </span>

      <div className="flex min-w-0 flex-1 gap-2">
        <Select
          value={attributeToAddId}
          onValueChange={onAttributeChange}
          disabled={disabled || availableAttributes.length === 0}
        >
          <SelectTrigger className="h-9 min-w-0 flex-1">
            <SelectValue
              placeholder={
                availableAttributes.length > 0
                  ? "Выберите свойство"
                  : "Все свойства добавлены"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {availableAttributes.map((attribute) => (
              <SelectItem key={attribute.id} value={attribute.id}>
                {attribute.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={disabled || !attributeToAddId}
          onClick={onAdd}
          title="Добавить свойство вариантов"
          className="h-9 w-9 shrink-0"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
};
