"use client";

import { CatalogProductsPanel } from "@/core/widgets/catalog-products";
import {
  CategoryAdminBarActions,
  CategoryAdminCardAction,
  useCategoryAdmin,
} from "@/core/widgets/category-admin";
import { LazyCatalogFilterDrawer } from "@/core/widgets/catalog-filter";
import {
  buildCategoryDisplayList,
  CategoryCard,
  type CategoryCardVariant,
  CategoryCardSkeleton,
} from "@/core/modules/category";
import { CategoryBarList, FilterBar } from "@/core/widgets/filter-bar";
import {
  type CategoryDto,
  useCategoryControllerGetAll,
} from "@/shared/api/generated/react-query";
import {
  getCatalogActiveFiltersCount,
  type CatalogFilterQueryState,
} from "@/shared/lib/catalog-filter-query";
import { canManageCatalogContent } from "@/core/catalog-runtime/content-access";
import { isCatalogManagerRole } from "@/shared/lib/catalog-role";
import { cn } from "@/shared/lib/utils";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { useSession } from "@/shared/providers/session-provider";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import dynamic from "next/dynamic";
import React from "react";
import {
  useActiveCategoryIntersection,
  useBrowserQueryState,
  useCategoryClickActivationDelay,
} from "@/core/modules/browser";

const CategoryAdminDrawersDynamic = dynamic(
  () =>
    import("@/core/widgets/category-admin").then(
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
  catalogTabLabel?: string;
  categoryAdminCreateDescription?: string;
  categoryAdminEditDescription?: string;
  categoryCardVariant?: CategoryCardVariant;
  supportsBrands?: boolean;
  supportsCategoryDetails?: boolean;
}

const CATEGORY_LOADING_SECTIONS_COUNT = 3;
const CATEGORY_LOADING_CARDS_COUNT = 4;

interface CatalogTabsToggleProps {
  catalogTabLabel?: string;
  tab: CatalogFilterQueryState["tab"];
}

const CatalogTabsToggle: React.FC<CatalogTabsToggleProps> = ({
  catalogTabLabel = "Каталог",
  tab,
}) => {
  return (
    <TabsList className="relative grid h-10 w-full grid-cols-2 rounded-pill p-0.5">
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-0 w-1/2 rounded-pill bg-surface-base transition-transform duration-300 ease-out",
          tab === "categories" && "translate-x-full",
        )}
      />
      <TabsTrigger
        value="catalog"
        className="relative z-10 rounded-pill text-sm data-[state=active]:bg-transparent data-[state=active]:shadow-none"
      >
        {catalogTabLabel}
      </TabsTrigger>
      <TabsTrigger
        value="categories"
        className="relative z-10 rounded-pill text-sm data-[state=active]:bg-transparent data-[state=active]:shadow-none"
      >
        Категории
      </TabsTrigger>
    </TabsList>
  );
};

export const Browser: React.FC<BrowserProps> = ({
  className,
  initialCategories = [],
  catalogTabLabel = "Каталог",
  categoryAdminCreateDescription,
  categoryAdminEditDescription,
  categoryCardVariant = "default",
  supportsBrands = true,
  supportsCategoryDetails = true,
}) => {
  const { user } = useSession();
  const { catalog } = useCatalogState();
  const canManageCategories =
    isCatalogManagerRole(user?.role) && canManageCatalogContent(catalog);
  const {
    activePanelIndex,
    queryState,
    swipeTranslatePercent,
    handleTabChange,
    handleFilterToggle,
  } = useBrowserQueryState();
  const categoriesQuery = useCategoryControllerGetAll(undefined, {
    query: {
      initialData: initialCategories,
      staleTime: canManageCategories ? 0 : 60_000,
    },
  });
  const categories = React.useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const isCategoriesInitialLoading =
    categories.length === 0 &&
    (categoriesQuery.isLoading || categoriesQuery.isFetching);
  const refetchCategories = categoriesQuery.refetch;
  const storefrontCategories = React.useMemo(
    () => buildCategoryDisplayList(categories, { hideEmpty: true }),
    [categories],
  );
  const adminCatalogCategories = React.useMemo(
    () => buildCategoryDisplayList(categories),
    [categories],
  );
  const catalogCategories = canManageCategories
    ? adminCatalogCategories
    : storefrontCategories;
  const effectiveQueryState = React.useMemo(
    () => ({
      ...queryState,
      brands: supportsBrands ? queryState.brands : [],
    }),
    [queryState, supportsBrands],
  );
  const effectiveIsFilterActive = React.useMemo(
    () =>
      Boolean(effectiveQueryState.filter) ||
      getCatalogActiveFiltersCount(effectiveQueryState) > 0,
    [effectiveQueryState],
  );
  const categoryAdmin = useCategoryAdmin({
    categories,
    supportsCategoryDetails,
  });

  React.useEffect(() => {
    if (!canManageCategories) {
      return;
    }

    void refetchCategories();
  }, [canManageCategories, refetchCategories]);
  const { activeCategoryId } = useActiveCategoryIntersection({
    categories: catalogCategories,
    enabled: effectiveQueryState.tab === "catalog" && !effectiveIsFilterActive,
  });
  const categoryClickActivation = useCategoryClickActivationDelay({
    enabled: effectiveQueryState.tab === "catalog" && !effectiveIsFilterActive,
  });
  const visibleActiveCategoryId =
    categoryClickActivation.activationBlockedCategoryId ??
    categoryClickActivation.forceActivatedCategoryId ??
    activeCategoryId;
  const shouldShowCategoryCardsLoading =
    categoriesQuery.isLoading && categories.length === 0;
  const activeFiltersCount = React.useMemo(
    () => getCatalogActiveFiltersCount(effectiveQueryState),
    [effectiveQueryState],
  );
  const shouldShowAdminActions =
    canManageCategories && effectiveQueryState.tab === "categories";
  const categoryCardItems = shouldShowAdminActions
    ? categories
    : storefrontCategories;
  const shouldRenderAdminDrawers =
    canManageCategories &&
    (categoryAdmin.isCreateOpen ||
      categoryAdmin.isReorderOpen ||
      categoryAdmin.editingCategory !== null ||
      categoryAdmin.deletingCategory !== null);
  const isCatalogPanelActive = activePanelIndex === 0;
  const isCategoriesPanelActive = activePanelIndex === 1;
  const [hasMountedAdminDrawers, setHasMountedAdminDrawers] = React.useState(
    shouldRenderAdminDrawers,
  );

  React.useEffect(() => {
    if (!supportsBrands && queryState.brands.length > 0) {
      handleFilterToggle({ brands: [] });
    }
  }, [handleFilterToggle, queryState.brands.length, supportsBrands]);

  React.useEffect(() => {
    if (!shouldRenderAdminDrawers) {
      return;
    }

    setHasMountedAdminDrawers(true);
  }, [shouldRenderAdminDrawers]);
  const filterBottomRow =
    effectiveQueryState.tab === "catalog" ? (
      !effectiveIsFilterActive ? (
        <CategoryBarList
          items={catalogCategories}
          isLoading={isCategoriesInitialLoading}
          activeCategoryId={visibleActiveCategoryId}
          onCategoryClick={categoryClickActivation.handleCategoryClick}
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
      className={cn("space-y-4 rounded-panel", className)}
    >
      <Tabs
        value={effectiveQueryState.tab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <CatalogTabsToggle
          catalogTabLabel={catalogTabLabel}
          tab={effectiveQueryState.tab}
        />

        <FilterBar
          tab={
            <CatalogTabsToggle
              catalogTabLabel={catalogTabLabel}
              tab={effectiveQueryState.tab}
            />
          }
          searchTerm={effectiveQueryState.searchTerm}
          isFilterActive={effectiveIsFilterActive}
          filterAction={
            <div className="flex items-center gap-2">
              {effectiveIsFilterActive ? (
                <Button
                  type="button"
                  className="h-10 rounded-pill px-4 whitespace-nowrap"
                  onClick={() => handleFilterToggle()}
                >
                  Сбросить фильтр
                </Button>
              ) : null}
              <LazyCatalogFilterDrawer
                queryState={effectiveQueryState}
                categories={catalogCategories}
                isCategoriesLoading={categoriesQuery.isLoading}
                activeFiltersCount={activeFiltersCount}
                shouldUseBrands={supportsBrands}
                onApply={handleFilterToggle}
              />
            </div>
          }
          onFilterToggle={handleFilterToggle}
          bottomRow={filterBottomRow}
        />

        <div className="overflow-hidden rounded-panel">
          <div
            className="flex w-[200%] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translateX(-${swipeTranslatePercent}%)` }}
          >
            <CatalogProductsPanel
              className="w-1/2 shrink-0 space-y-7.5"
              contentClassName="m-1"
              collapsed={!isCatalogPanelActive}
              categories={catalogCategories}
              isCategoriesLoading={isCategoriesInitialLoading}
              isFilterActive={effectiveIsFilterActive}
              queryState={effectiveQueryState}
              activationBlockedCategoryId={
                categoryClickActivation.activationBlockedCategoryId
              }
              forceActivatedCategoryId={
                categoryClickActivation.forceActivatedCategoryId
              }
              loadingSectionsCount={CATEGORY_LOADING_SECTIONS_COUNT}
            />

            <div
              className={cn(
                "w-1/2 shrink-0",
                !isCategoriesPanelActive &&
                  "pointer-events-none h-0 overflow-hidden",
              )}
              aria-hidden={!isCategoriesPanelActive}
            >
              {shouldShowCategoryCardsLoading
                ? Array.from({ length: CATEGORY_LOADING_CARDS_COUNT }).map(
                    (_, index) => (
                      <CategoryCardSkeleton
                        key={`category-card-skeleton-${index}`}
                        variant={categoryCardVariant}
                      />
                    ),
                  )
                : categoryCardItems.map((category, index) => (
                    <CategoryCard
                      handleClick={() =>
                        handleFilterToggle({
                          categories: [category.id],
                        })
                      }
                      key={category.id}
                      data={category}
                      index={index}
                      variant={categoryCardVariant}
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
        <CategoryAdminDrawersDynamic
          admin={categoryAdmin}
          createDescription={categoryAdminCreateDescription}
          editDescription={categoryAdminEditDescription}
          supportsCategoryDetails={supportsCategoryDetails}
        />
      ) : null}
    </section>
  );
};
