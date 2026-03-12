"use client";

import {
  type CatalogFilterItem,
  type CatalogFilterPatch,
} from "@/core/widgets/catalog-filter/model/catalog-filter-drawer";
import { useCatalogFilterDrawer } from "@/core/widgets/catalog-filter/model/use-catalog-filter-drawer";
import { CatalogFilterDrawerTrigger } from "@/core/widgets/catalog-filter/ui/catalog-filter-drawer-trigger";
import { cn } from "@/shared/lib/utils";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { RefreshCcw } from "lucide-react";
import React from "react";

import { type CatalogFilterQueryState } from "@/shared/lib/catalog-filter-query";

interface CatalogFilterDrawerProps {
  className?: string;
  queryState: CatalogFilterQueryState;
  activeFiltersCount: number;
  categories: CatalogFilterItem[];
  isCategoriesLoading?: boolean;
  onApply: (patch?: CatalogFilterPatch) => void;
}

const FilterSection: React.FC<
  React.PropsWithChildren<{ title: string; className?: string }>
> = ({ title, className, children }) => {
  return (
    <section className={cn("space-y-4", className)}>
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
};

interface FilterListProps {
  items: CatalogFilterItem[];
  isLoading: boolean;
  selectedItems: string[];
  onToggle: (id: string) => void;
}

const FilterList: React.FC<FilterListProps> = ({
  items,
  isLoading,
  selectedItems,
  onToggle,
}) => {
  if (isLoading) {
    return (
      <ul className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <li key={`filter-list-skeleton-${index}`}>
            <Skeleton className="h-5 w-full" />
          </li>
        ))}
      </ul>
    );
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">Нет данных</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const isChecked = selectedItems.includes(item.id);

        return (
          <li key={item.id} className="flex items-center gap-3">
            <Checkbox
              id={item.id}
              checked={isChecked}
              onCheckedChange={() => onToggle(item.id)}
            />
            <label htmlFor={item.id} className="cursor-pointer">
              {item.name}
            </label>
          </li>
        );
      })}
    </ul>
  );
};

interface FilterPriceInputProps {
  label: string;
  placeholder: string;
  value?: string;
  onChange: (value: string) => void;
}

const FilterPriceInput: React.FC<FilterPriceInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{label}</span>
      <Input
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
};

export const CatalogFilterDrawer: React.FC<CatalogFilterDrawerProps> = ({
  className,
  queryState,
  activeFiltersCount,
  categories,
  isCategoriesLoading = false,
  onApply,
}) => {
  const {
    brands,
    brandsQuery,
    draft,
    handleClear,
    handleSubmit,
    open,
    patchDraft,
    setOpen,
    toggleArrayDraftValue,
    toggleBooleanDraftValue,
  } = useCatalogFilterDrawer({
    onApply,
    queryState,
  });

  return (
    <AppDrawer
      open={open}
      onOpenChange={setOpen}
      className={className}
      trigger={
        <CatalogFilterDrawerTrigger activeFiltersCount={activeFiltersCount} />
      }
    >
      <AppDrawer.Content className="mx-auto w-full max-w-2xl">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Фильтр"
            description=""
            trailingTitleNode={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={handleClear}
                aria-label="Сбросить фильтр"
              >
                <RefreshCcw className="size-4" />
              </Button>
            }
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="space-y-6">
              <FilterSection title="Категории">
                <FilterList
                  items={categories}
                  isLoading={isCategoriesLoading}
                  selectedItems={draft.categories}
                  onToggle={(id) => toggleArrayDraftValue("categories", id)}
                />
              </FilterSection>

              <hr />

              <FilterSection title="Бренды">
                <FilterList
                  items={brands}
                  isLoading={brandsQuery.isLoading}
                  selectedItems={draft.brands}
                  onToggle={(id) => toggleArrayDraftValue("brands", id)}
                />
              </FilterSection>

              <hr />

              <FilterSection title="Цена">
                <div className="flex flex-wrap gap-4 sm:gap-8 [&_input]:max-w-[140px]">
                  <FilterPriceInput
                    label="от"
                    placeholder="0"
                    value={draft.minPrice}
                    onChange={(value) => patchDraft({ minPrice: value })}
                  />
                  <FilterPriceInput
                    label="до"
                    placeholder="100000"
                    value={draft.maxPrice}
                    onChange={(value) => patchDraft({ maxPrice: value })}
                  />
                </div>
              </FilterSection>

              <hr />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="catalog-filter-popular"
                    checked={draft.isPopular}
                    onCheckedChange={() => toggleBooleanDraftValue("isPopular")}
                  />
                  <label htmlFor="catalog-filter-popular" className="cursor-pointer">
                    Популярные товары
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="catalog-filter-discount"
                    checked={draft.isDiscount}
                    onCheckedChange={() => toggleBooleanDraftValue("isDiscount")}
                  />
                  <label
                    htmlFor="catalog-filter-discount"
                    className="cursor-pointer"
                  >
                    Товары со скидкой
                  </label>
                </div>
              </div>
            </div>
          </DrawerScrollArea>

          <AppDrawer.Footer
            className="border-t"
            isAutoClose={false}
            btnText="Сохранить и найти"
            handleClick={handleSubmit}
          />
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
