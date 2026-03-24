"use client";

import { type CategoryListItem } from "@/core/modules/product/editor/model/use-create-product-categories-field";
import { ChevronRight, Trash2 } from "lucide-react";

interface CreateProductCategoriesSummaryProps {
  disabled: boolean;
  onOpen: () => void;
  onRemove: (categoryId: string) => void;
  placeholder?: string;
  selectedCategories: CategoryListItem[];
}

export function CreateProductCategoriesSummary({
  disabled,
  onOpen,
  onRemove,
  placeholder,
  selectedCategories,
}: CreateProductCategoriesSummaryProps) {
  return (
    <div className="w-full border-b text-muted-foreground">
      {selectedCategories.length > 0 ? (
        selectedCategories.map((category, index) => (
          <div key={category.id} className="w-full text-black">
            <div className="flex items-center justify-between gap-2 pb-4">
              <button
                type="button"
                className="flex min-w-0 items-center gap-1"
                onClick={onOpen}
                disabled={disabled}
              >
                <span className="truncate">{category.name}</span>
                <ChevronRight className="size-4 shrink-0" />
              </button>

              <button
                type="button"
                className="text-muted transition-colors hover:text-foreground disabled:opacity-50"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(category.id);
                }}
                disabled={disabled}
                aria-label={`Удалить категорию ${category.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            {index < selectedCategories.length - 1 ? <hr /> : null}
          </div>
        ))
      ) : (
        <button
          type="button"
          className="flex w-full items-center gap-1 pb-4 text-left"
          onClick={onOpen}
          disabled={disabled}
        >
          <span>{placeholder ?? "Выбрать категорию"}</span>
          <ChevronRight className="size-4 shrink-0" />
        </button>
      )}
    </div>
  );
}

