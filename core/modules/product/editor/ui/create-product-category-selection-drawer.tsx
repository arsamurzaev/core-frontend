"use client";

import { type CategoryListItem } from "@/core/modules/product/editor/model/use-create-product-categories-field";
import { cn } from "@/shared/lib/utils";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";

interface CreateProductCategorySelectionDrawerProps {
  categoryList: CategoryListItem[];
  draftValues: string[];
  hasChanges: boolean;
  isControlDisabled: boolean;
  isLoading: boolean;
  onApply: () => void;
  onOpenChange: (open: boolean) => void;
  onRequestCreate: () => void;
  onRequestDelete: (category: CategoryListItem) => void;
  onRequestEdit: (category: CategoryListItem) => void;
  onToggleValue: (categoryId: string) => void;
  open: boolean;
}

export function CreateProductCategorySelectionDrawer({
  categoryList,
  draftValues,
  hasChanges,
  isControlDisabled,
  isLoading,
  onApply,
  onOpenChange,
  onRequestCreate,
  onRequestDelete,
  onRequestEdit,
  onToggleValue,
  open,
}: CreateProductCategorySelectionDrawerProps) {
  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      dismissible={!isControlDisabled}
    >
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Выбор категории"
            description="Укажите категорию или добавьте новую. Это нужно для того, чтобы пользователи легче могли найти товар или услугу по своему запросу в фильтрах."
          />

          <div className="overflow-y-auto">
            <hr />

            <div className="p-5">
              <button
                type="button"
                className="shadow-custom w-full rounded-lg px-3 py-3 text-center text-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onRequestCreate}
                disabled={isControlDisabled}
              >
                + добавить категорию
              </button>
            </div>

            <hr />

            <DrawerScrollArea className="px-5 py-7">
              <div className="grid grid-cols-[90px_1fr] gap-3">
                <h2 className="text-sm font-medium">Выбрать категорию:</h2>
                <ul className="space-y-5">
                  {isLoading && categoryList.length === 0 ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <li
                        key={index}
                        className="bg-muted h-6 w-full animate-pulse rounded"
                      />
                    ))
                  ) : categoryList.length === 0 ? (
                    <li className="text-sm text-muted-foreground">
                      Список категорий пуст.
                    </li>
                  ) : (
                    categoryList.map((category) => {
                      const isSelected = draftValues.includes(category.id);

                      return (
                        <li
                          key={category.id}
                          className={cn(
                            "flex gap-3 border-b pb-4",
                            isSelected ? "text-black" : "text-muted-foreground",
                          )}
                        >
                          <Button
                            type="button"
                            className="size-7 rounded-full"
                            variant="ghost"
                            size="icon"
                            disabled={isControlDisabled}
                            onClick={() => onRequestEdit(category)}
                            aria-label={`Редактировать категорию ${category.name}`}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            className="size-7 rounded-full"
                            variant="ghost"
                            size="icon"
                            disabled={isControlDisabled}
                            onClick={() => onRequestDelete(category)}
                            aria-label={`Удалить категорию ${category.name}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                          <button
                            type="button"
                            className="flex items-center gap-1 text-left text-base"
                            disabled={isControlDisabled}
                            onClick={() => onToggleValue(category.id)}
                          >
                            <span>{category.name}</span>
                            <ChevronRight className="size-3 shrink-0" />
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
            handleClick={onApply}
          />
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
}

