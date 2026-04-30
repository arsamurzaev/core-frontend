"use client";

import { invalidateProductQueries } from "@/core/modules/product/actions/model/invalidate-product-queries";
import {
  useProductControllerUpdateCategoryPosition,
} from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown, X } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface ChangeProductCategoryPositionActionProps {
  categoryId: string;
  currentPosition: number;
  disabled?: boolean;
  onPendingChange?: (isPending: boolean) => void;
  productId: string;
}

function getDisplayPosition(position: number): string {
  return String(position + 1);
}

function parsePositionInput(value: string): number | null {
  const normalizedValue = value.trim();

  if (!normalizedValue || !/^\d+$/.test(normalizedValue)) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isSafeInteger(parsedValue) || parsedValue < 1) {
    return null;
  }

  return parsedValue - 1;
}

export const ChangeProductCategoryPositionAction: React.FC<
  ChangeProductCategoryPositionActionProps
> = ({
  categoryId,
  currentPosition,
  disabled = false,
  onPendingChange,
  productId,
}) => {
  const queryClient = useQueryClient();
  const updateCategoryPosition = useProductControllerUpdateCategoryPosition();
  const [open, setOpen] = React.useState(false);
  const [positionInput, setPositionInput] = React.useState(() =>
    getDisplayPosition(currentPosition),
  );

  React.useEffect(() => {
    if (!open) {
      setPositionInput(getDisplayPosition(currentPosition));
    }
  }, [currentPosition, open]);

  React.useEffect(() => {
    onPendingChange?.(updateCategoryPosition.isPending);

    return () => {
      onPendingChange?.(false);
    };
  }, [onPendingChange, updateCategoryPosition.isPending]);

  const nextPosition = React.useMemo(
    () => parsePositionInput(positionInput),
    [positionInput],
  );
  const isUnchangedPosition = nextPosition === currentPosition;
  const isSubmitDisabled =
    disabled ||
    updateCategoryPosition.isPending ||
    nextPosition === null ||
    isUnchangedPosition;

  const handleInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      event.stopPropagation();
      setPositionInput(event.target.value.replace(/[^\d]/g, ""));
    },
    [],
  );

  const handlePopoverOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
  }, []);

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (nextPosition === null) {
        toast.error("Укажите позицию целым числом, начиная с 1.");
        return;
      }

      if (nextPosition === currentPosition) {
        setOpen(false);
        return;
      }

      try {
        await updateCategoryPosition.mutateAsync({
          id: productId,
          data: {
            categoryId,
            position: nextPosition,
          },
        });
        await invalidateProductQueries(queryClient);
        setOpen(false);
        toast.success(
          `Позиция товара изменена на ${getDisplayPosition(nextPosition)}.`,
        );
      } catch (error) {
        toast.error(extractApiErrorMessage(error));
      }
    },
    [
      categoryId,
      currentPosition,
      nextPosition,
      productId,
      queryClient,
      updateCategoryPosition,
    ],
  );

  return (
    <Popover open={open} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={disabled || updateCategoryPosition.isPending}
          className="shadow-custom h-[30px] w-[30px] rounded-full border-0 bg-white hover:bg-white"
          aria-label="Сменить позицию товара в категории"
        >
          <ArrowUpDown className="text-muted-foreground size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="relative w-64 space-y-3 pr-10"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={updateCategoryPosition.isPending}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }}
          className="absolute top-2 right-2 size-7 rounded-full p-0"
          aria-label="Закрыть"
        >
          <X className="size-4" />
        </Button>

        <PopoverHeader className="space-y-1">
          <PopoverTitle>Позиция в категории</PopoverTitle>
          <PopoverDescription>
            Текущая позиция: {getDisplayPosition(currentPosition)}. Нумерация
            начинается с 1.
          </PopoverDescription>
        </PopoverHeader>

        <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
          <Input
            autoFocus
            type="text"
            inputMode="numeric"
            value={positionInput}
            onChange={handleInputChange}
            placeholder={getDisplayPosition(currentPosition)}
            aria-label="Новая позиция товара"
          />
          <Button type="submit" size="sm" className="w-full" disabled={isSubmitDisabled}>
            {updateCategoryPosition.isPending ? "Сохраняем..." : "Сохранить"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
};
