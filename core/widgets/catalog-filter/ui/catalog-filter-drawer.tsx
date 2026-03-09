"use client";

import { useBrandControllerGetAll } from "@/shared/api/generated";
import { type CatalogFilterQueryState } from "@/shared/lib/catalog-filter-query";
import { cn } from "@/shared/lib/utils";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { RefreshCcw, SlidersVertical } from "lucide-react";
import React from "react";

type CatalogFilterDraftState = Pick<
  CatalogFilterQueryState,
  | "categories"
  | "brands"
  | "isPopular"
  | "isDiscount"
  | "searchTerm"
  | "minPrice"
  | "maxPrice"
>;

type CatalogFilterPatch = Partial<CatalogFilterDraftState>;

type CatalogFilterItem = {
  id: string;
  name: string;
};

interface CatalogFilterDrawerProps {
  className?: string;
  queryState: CatalogFilterQueryState;
  activeFiltersCount: number;
  categories: CatalogFilterItem[];
  isCategoriesLoading?: boolean;
  onApply: (patch?: CatalogFilterPatch) => void;
}

const CATALOG_FILTER_EMPTY_PATCH: CatalogFilterPatch = {
  categories: [],
  brands: [],
  isPopular: undefined,
  isDiscount: undefined,
  searchTerm: undefined,
  minPrice: undefined,
  maxPrice: undefined,
};

const createDraftFromQueryState = (
  queryState: CatalogFilterQueryState,
): CatalogFilterDraftState => ({
  categories: [...queryState.categories],
  brands: [...queryState.brands],
  isPopular: queryState.isPopular,
  isDiscount: queryState.isDiscount,
  searchTerm: queryState.searchTerm,
  minPrice: queryState.minPrice,
  maxPrice: queryState.maxPrice,
});

const normalizeDraft = (
  draft: CatalogFilterDraftState,
): CatalogFilterDraftState => {
  const normalizeList = (value: string[]): string[] => {
    const cleaned = value
      .map((item) => item.trim())
      .filter(Boolean);
    return Array.from(new Set(cleaned));
  };
  const normalizeString = (value?: string): string | undefined => {
    if (typeof value !== "string") {
      return undefined;
    }
    const cleaned = value.trim();
    return cleaned || undefined;
  };

  return {
    categories: normalizeList(draft.categories),
    brands: normalizeList(draft.brands),
    isPopular: draft.isPopular ? true : undefined,
    isDiscount: draft.isDiscount ? true : undefined,
    searchTerm: normalizeString(draft.searchTerm),
    minPrice: normalizeString(draft.minPrice),
    maxPrice: normalizeString(draft.maxPrice),
  };
};

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
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<CatalogFilterDraftState>(() =>
    createDraftFromQueryState(queryState),
  );
  const brandsQuery = useBrandControllerGetAll();
  const brands = React.useMemo(() => brandsQuery.data ?? [], [brandsQuery.data]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setDraft(createDraftFromQueryState(queryState));
  }, [open, queryState]);

  const patchDraft = React.useCallback(
    (patch: Partial<CatalogFilterDraftState>) => {
      setDraft((previousValue) => ({ ...previousValue, ...patch }));
    },
    [],
  );

  const toggleArrayDraftValue = React.useCallback(
    (key: "categories" | "brands", value: string) => {
      const normalized = value.trim();
      if (!normalized) {
        return;
      }

      setDraft((previousValue) => {
        const currentItems = previousValue[key];
        const nextItems = currentItems.includes(normalized)
          ? currentItems.filter((item) => item !== normalized)
          : [...currentItems, normalized];

        return {
          ...previousValue,
          [key]: nextItems,
        };
      });
    },
    [],
  );

  const toggleBooleanDraftValue = React.useCallback(
    (key: "isPopular" | "isDiscount") => {
      setDraft((previousValue) => ({
        ...previousValue,
        [key]: previousValue[key] ? undefined : true,
      }));
    },
    [],
  );

  const handleClear = React.useCallback(() => {
    setDraft(createDraftFromQueryState({ ...queryState, ...CATALOG_FILTER_EMPTY_PATCH }));
    onApply(CATALOG_FILTER_EMPTY_PATCH);
    setOpen(false);
  }, [onApply, queryState]);

  const handleSubmit = React.useCallback(() => {
    onApply(normalizeDraft(draft));
    setOpen(false);
  }, [draft, onApply]);

  return (
    <AppDrawer
      open={open}
      onOpenChange={setOpen}
      className={className}
      trigger={
        <button
          type="button"
          className={cn(
            "shadow-custom relative flex h-10 w-10 items-center justify-center rounded-full bg-background",
            activeFiltersCount > 0 && "bg-primary text-primary-foreground",
          )}
          aria-label="Открыть фильтр"
        >
          {activeFiltersCount > 0 ? (
            <Badge
              variant="secondary"
              className="shadow-custom absolute top-0 -right-1 h-4 min-w-4 rounded-full px-1 text-[10px]"
            >
              {activeFiltersCount}
            </Badge>
          ) : null}
          <SlidersVertical size={20} />
        </button>
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
                  <label htmlFor="catalog-filter-discount" className="cursor-pointer">
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
