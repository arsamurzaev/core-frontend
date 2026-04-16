"use client";

import { useCreateProductBrandField } from "@/core/modules/product/editor/model/use-create-product-brand-field";
import { cn } from "@/shared/lib/utils";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { ConfirmationDrawer } from "@/shared/ui/confirmation-drawer";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { type DynamicFieldRenderProps } from "@/shared/ui/dynamic-form";
import { Input } from "@/shared/ui/input";
import { ChevronRight, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { type FieldValues } from "react-hook-form";

export function CreateProductBrandField<TValues extends FieldValues>(
  props: DynamicFieldRenderProps<TValues>,
) {
  const { field, placeholder } = props;
  const {
    brandList,
    brandsQuery,
    createBrand,
    createName,
    deletingBrand,
    draftValue,
    editName,
    editingBrand,
    handleApply,
    handleCreateBrand,
    handleDeleteBrand,
    handleEditOpenChange,
    handleStartEdit,
    handleUpdateBrand,
    hasChanges,
    isControlDisabled,
    open,
    openDrawer,
    selectedBrand,
    setCreateName,
    setDeletingBrand,
    setDraftValue,
    setEditName,
    setOpen,
    updateBrand,
  } = useCreateProductBrandField(props);

  return (
    <>
      <div className="w-full border-b text-muted-foreground">
        {selectedBrand ? (
          <div className="flex items-center justify-between gap-2 pb-4">
            <button
              type="button"
              className="flex min-w-0 items-center gap-1 text-black"
              onClick={openDrawer}
              disabled={isControlDisabled}
            >
              <span className="truncate">{selectedBrand.name}</span>
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
        <AppDrawer.Content className="w-full">
          <div className="flex min-h-0 flex-1 flex-col">
            <AppDrawer.Header
              title="Выбор бренда"
              description="Укажите бренд или добавьте новый. Это нужно для того, чтобы пользователи легче могли найти товар или услугу по своему запросу в фильтрах."
            />

            <div className="overflow-y-auto">
              <hr />

              <form
                className="px-5 py-7"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleCreateBrand();
                }}
              >
                <div className="grid grid-cols-[90px_1fr_auto] items-center gap-3">
                  <h2 className="text-sm font-medium">Добавить бренд:</h2>
                  <Input
                    value={createName}
                    onChange={(event) => setCreateName(event.target.value)}
                    placeholder="Например: Gucci, Karcher, Тефаль"
                    maxLength={40}
                    disabled={createBrand.isPending || isControlDisabled}
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    disabled={createBrand.isPending || isControlDisabled}
                    aria-label="Добавить бренд"
                  >
                    {createBrand.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </Button>
                </div>
              </form>

              <hr />

              <DrawerScrollArea className="px-5 py-7">
                <div className="grid grid-cols-[90px_1fr] gap-3">
                  <h2 className="text-sm font-medium">Выбрать бренд:</h2>
                  <ul className="space-y-5">
                    {brandsQuery.isLoading && brandList.length === 0 ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <li
                          key={index}
                          className="bg-muted h-6 w-full animate-pulse rounded"
                        />
                      ))
                    ) : brandList.length === 0 ? (
                      <li className="text-sm text-muted-foreground">
                        Список брендов пуст.
                      </li>
                    ) : (
                      brandList.map((brand) => {
                        const isSelected = draftValue === brand.id;

                        return (
                          <li
                            key={brand.id}
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
                              onClick={() => handleStartEdit(brand)}
                              aria-label={`Редактировать бренд ${brand.name}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              className="size-7 rounded-full"
                              variant="ghost"
                              size="icon"
                              disabled={isControlDisabled}
                              onClick={() => setDeletingBrand(brand)}
                              aria-label={`Удалить бренд ${brand.name}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                            <button
                              type="button"
                              className="flex items-center gap-1 text-left text-base"
                              disabled={isControlDisabled}
                              onClick={() =>
                                setDraftValue((current) =>
                                  current === brand.id ? null : brand.id,
                                )
                              }
                            >
                              <span>{brand.name}</span>
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
              handleClick={handleApply}
            />
          </div>
        </AppDrawer.Content>
      </AppDrawer>

      <AppDrawer
        open={Boolean(editingBrand)}
        onOpenChange={handleEditOpenChange}
        dismissible={!updateBrand.isPending}
      >
        <AppDrawer.Content className="w-full">
          <div className="flex min-h-0 flex-1 flex-col">
            <AppDrawer.Header
              title="Редактор бренда"
              description="Измените название бренда. Обновление сразу попадет в список выбора товара."
              withCloseButton={!updateBrand.isPending}
            />
            <hr />

            <div className="space-y-6 px-6 py-6">
              <div className="space-y-2">
                <p className="text-sm font-medium">Бренд:</p>
                <Input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  placeholder="Например: Gucci, Karcher, Тефаль"
                  maxLength={40}
                  disabled={updateBrand.isPending}
                />
              </div>
            </div>

            <AppDrawer.Footer
              className="border-t"
              isAutoClose={false}
              loading={updateBrand.isPending}
              buttonType="button"
              handleClick={() => void handleUpdateBrand()}
            />
          </div>
        </AppDrawer.Content>
      </AppDrawer>

      <ConfirmationDrawer
        open={Boolean(deletingBrand)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDeletingBrand(null);
          }
        }}
        title="Удалить бренд?"
        description={
          deletingBrand
            ? `Бренд "${deletingBrand.name}" будет удален из каталога.`
            : undefined
        }
        confirmText="Удалить"
        pendingText="Удаление..."
        tone="destructive"
        onConfirm={handleDeleteBrand}
      />
    </>
  );
}

