"use client";

import { CatalogProductsPanel } from "@/core/modules/browser/ui/catalog-products-panel";
import { CategoryCard } from "@/core/modules/category/ui/category-card";
import { CategoryCardSkeleton } from "@/core/modules/category/ui/category-card-skeleton";
import { useCategoryAdmin } from "@/core/widgets/category-admin/model/use-category-admin";
import { CategoryAdminBarActions } from "@/core/widgets/category-admin/ui/category-admin-bar-actions";
import { CategoryAdminCardAction } from "@/core/widgets/category-admin/ui/category-admin-card-action";
import { LazyCatalogFilterDrawer } from "@/core/widgets/catalog-filter/ui/lazy-catalog-filter-drawer";
import { CATEGORY_PRODUCTS_PAGE_SIZE } from "@/core/widgets/category-products/ui/category-products";
import { CategoryBarList } from "@/core/widgets/filter-bar/ui/category-bar-list";
import { FilterBar } from "@/core/widgets/filter-bar/ui/filter-bar";
import {
  type CategoryDto,
  useCategoryControllerGetAll,
} from "@/shared/api/generated/react-query";
import {
  getCatalogActiveFiltersCount,
  type CatalogFilterQueryState,
} from "@/shared/lib/catalog-filter-query";
import { isCatalogManagerRole } from "@/shared/lib/catalog-role";
import { cn } from "@/shared/lib/utils";
import { useSession } from "@/shared/providers/session-provider";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import dynamic from "next/dynamic";
import React from "react";
import { useBrowserQueryState } from "@/core/modules/browser/model/use-browser-query-state";
import { useCategoryScrollNavigation } from "@/core/modules/browser/model/use-category-scroll-navigation";

const CategoryAdminDrawersDynamic = dynamic(
  () =>
    import("@/core/widgets/category-admin/ui/category-admin-drawers").then(
      (module) => module.CategoryAdminDrawers,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

interface BrowserProps {
  className?: string;
  initialCategories?: CategoryDto[];
}

const CATEGORY_LOADING_SECTIONS_COUNT = 3;
const CATEGORY_LOADING_CARDS_COUNT = 4;

interface CatalogTabsToggleProps {
  tab: CatalogFilterQueryState["tab"];
}

const CatalogTabsToggle: React.FC<CatalogTabsToggleProps> = ({ tab }) => {
  return (
    <TabsList className="relative grid h-10 w-full grid-cols-2 rounded-full p-0.5">
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-0 w-1/2 rounded-full bg-background shadow-custom transition-transform duration-300 ease-out",
          tab === "categories" && "translate-x-full",
        )}
      />
      <TabsTrigger
        value="catalog"
        className="relative z-10 rounded-full text-sm data-[state=active]:bg-transparent data-[state=active]:shadow-none"
      >
        Каталог
      </TabsTrigger>
      <TabsTrigger
        value="categories"
        className="relative z-10 rounded-full text-sm data-[state=active]:bg-transparent data-[state=active]:shadow-none"
      >
        Категории
      </TabsTrigger>
    </TabsList>
  );
};

export const Browser: React.FC<BrowserProps> = ({
  className,
  initialCategories = [],
}) => {
  const {
    queryState,
    isFilterActive,
    swipeTranslatePercent,
    handleTabChange,
    handleFilterToggle,
  } = useBrowserQueryState();
  const categoriesQuery = useCategoryControllerGetAll({
    query: {
      initialData: initialCategories,
      staleTime: 60_000,
    },
  });
  const categories = React.useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const { user } = useSession();
  const canManageCategories = isCatalogManagerRole(user?.role);
  const categoryAdmin = useCategoryAdmin({
    categories,
  });
  const {
    activeCategoryId,
    isProgrammaticScroll,
    programmaticScrollTargetId,
    handleCategoryBarClick,
  } = useCategoryScrollNavigation({
    categories,
    isCatalogTab: queryState.tab === "catalog",
    isFilterActive,
    pageSize: CATEGORY_PRODUCTS_PAGE_SIZE,
  });
  const shouldShowCategoryCardsLoading =
    categoriesQuery.isLoading && categories.length === 0;
  const activeFiltersCount = React.useMemo(
    () => getCatalogActiveFiltersCount(queryState),
    [queryState],
  );
  const shouldShowAdminActions =
    canManageCategories && queryState.tab === "categories";
  const shouldRenderAdminDrawers =
    canManageCategories &&
    (categoryAdmin.isCreateOpen ||
      categoryAdmin.isReorderOpen ||
      categoryAdmin.editingCategory !== null ||
      categoryAdmin.deletingCategory !== null);
  const [hasMountedAdminDrawers, setHasMountedAdminDrawers] = React.useState(
    shouldRenderAdminDrawers,
  );

  React.useEffect(() => {
    if (!shouldRenderAdminDrawers) {
      return;
    }

    setHasMountedAdminDrawers(true);
  }, [shouldRenderAdminDrawers]);
  const filterBottomRow =
    queryState.tab === "catalog" ? (
      !isFilterActive ? (
        <CategoryBarList
          items={categories}
          isLoading={categoriesQuery.isLoading}
          activeCategoryId={activeCategoryId}
          onCategoryClick={handleCategoryBarClick}
        />
      ) : null
    ) : shouldShowAdminActions ? (
      <CategoryAdminBarActions
        canReorder={categories.length > 1}
        disabled={categoriesQuery.isLoading}
        onCreateClick={() => categoryAdmin.setIsCreateOpen(true)}
        onReorderClick={() => categoryAdmin.handleReorderOpenChange(true)}
      />
    ) : null;

  return (
    <section
      id="scroll-tab-element"
      className={cn("space-y-4 rounded-xl", className)}
    >
      <Tabs
        value={queryState.tab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <CatalogTabsToggle tab={queryState.tab} />

        <FilterBar
          tab={<CatalogTabsToggle tab={queryState.tab} />}
          searchTerm={queryState.searchTerm}
          filterAction={
            <LazyCatalogFilterDrawer
              queryState={queryState}
              categories={categories}
              isCategoriesLoading={categoriesQuery.isLoading}
              activeFiltersCount={activeFiltersCount}
              onApply={handleFilterToggle}
            />
          }
          onFilterToggle={handleFilterToggle}
          bottomRow={filterBottomRow}
        />

        <div className="overflow-hidden rounded-lg">
          <div
            className="flex w-[200%] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateX(-${swipeTranslatePercent}%)` }}
          >
            <CatalogProductsPanel
              className="w-1/2 shrink-0 space-y-7.5"
              contentClassName="m-1"
              collapsed={queryState.tab === "categories"}
              categories={categories}
              isCategoriesLoading={categoriesQuery.isLoading}
              isFilterActive={isFilterActive}
              queryState={queryState}
              activeCategoryId={activeCategoryId}
              isProgrammaticScroll={isProgrammaticScroll}
              programmaticScrollTargetId={programmaticScrollTargetId}
              loadingSectionsCount={CATEGORY_LOADING_SECTIONS_COUNT}
            />

            <div className="w-1/2 shrink-0">
              {shouldShowCategoryCardsLoading
                ? Array.from({ length: CATEGORY_LOADING_CARDS_COUNT }).map(
                    (_, index) => (
                      <CategoryCardSkeleton
                        key={`category-card-skeleton-${index}`}
                      />
                    ),
                  )
                : categories.map((category, index) => (
                    <CategoryCard
                      handleClick={() =>
                        handleFilterToggle({
                          categories: [category.id],
                        })
                      }
                      key={category.id}
                      data={category}
                      index={index}
                      action={
                        canManageCategories
                          ? (currentCategory) => (
                              <CategoryAdminCardAction
                                onClick={() =>
                                  categoryAdmin.handleStartEdit(currentCategory)
                                }
                              />
                            )
                          : undefined
                      }
                    />
                  ))}
            </div>
          </div>
        </div>
      </Tabs>

      {canManageCategories && hasMountedAdminDrawers ? (
        <CategoryAdminDrawersDynamic admin={categoryAdmin} />
      ) : null}
    </section>
  );
};
