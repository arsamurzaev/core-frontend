"use client";

import { ProductCardRuntime } from "@/core/catalog-runtime/ui";
import {
  CATEGORY_SECTION_SCROLL_MARGIN_TOP,
  FILTER_PRODUCTS_RESULTS_SECTION_ID,
} from "@/core/modules/browser";
import {
  CartProductAction,
  CartProductCardFooterAction,
  useCart,
} from "@/core/modules/cart";
import {
  isIikoProduct,
  isMoySkladProduct,
  ProductCardSkeleton,
  ProductDomBudgetContent,
  PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME,
  PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME,
  ProductLink,
  ToggleProductPopularAction,
  useProductCardViewMode,
} from "@/core/modules/product";
import { EditProductCardAction } from "@/core/widgets/edit-product-drawer/ui/edit-product-card-action";
import {
  DETAILED_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT,
  DETAILED_FILTER_PRODUCTS_NEXT_PAGE_SKELETON_COUNT,
  GRID_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT,
  GRID_FILTER_PRODUCTS_NEXT_PAGE_SKELETON_COUNT,
} from "@/core/widgets/filter-products/model/filter-products";
import { useFilterProducts } from "@/core/widgets/filter-products/model/use-filter-products";
import { useFilterRecommendations } from "@/core/widgets/filter-products/model/use-filter-recommendations";
import { ProductWithAttributesDtoStatus } from "@/shared/api/generated/react-query";
import type { CatalogFilterQueryState } from "@/shared/lib/catalog-filter-query";
import {
  canManageCatalogContent,
  isChildCatalog,
} from "@/shared/lib/catalog-content-access";
import { cn } from "@/shared/lib/utils";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { useSession } from "@/shared/providers/session-provider";
import React from "react";

interface FilterProductsProps {
  className?: string;
  queryState: CatalogFilterQueryState;
}

type FilterSectionProduct = {
  id: string;
  slug: string;
} & React.ComponentProps<typeof ProductCardRuntime>["data"];

interface FilterProductCardProps {
  product: FilterSectionProduct;
  imageLoading: React.ImgHTMLAttributes<HTMLImageElement>["loading"];
  isDetailed: boolean;
  shouldUseCartUi: boolean;
  isAuthenticated: boolean;
  canManageContent: boolean;
  showParentCatalogHiddenStatus: boolean;
  quantity: number;
}

interface FilterProductSectionProps {
  emptyText: string;
  fetchNextPage: () => unknown;
  hasNextPage: boolean;
  heading: string;
  eagerFirstImages?: boolean;
  isAuthenticated: boolean;
  isDetailed: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  productPages: FilterSectionProduct[][];
  products: FilterSectionProduct[];
  sectionId?: string;
  shouldUseCartUi: boolean;
  canManageContent: boolean;
  showParentCatalogHiddenStatus: boolean;
  quantityByProductId: Readonly<Record<string, number>>;
}

const FILTER_PRODUCTS_INTERSECTION_ROOT_MARGIN = "900px 0px";
const FILTER_PRODUCTS_NEXT_PAGE_INTERSECTION_ROOT_MARGIN = "360px 0px";
const FILTER_PRODUCTS_DOM_BUDGET_PRODUCT_COUNT = 144;

function useIntersectionCallback({
  enabled,
  onIntersect,
  rootMargin = FILTER_PRODUCTS_INTERSECTION_ROOT_MARGIN,
}: {
  enabled: boolean;
  onIntersect: () => void;
  rootMargin?: string;
}) {
  const [element, setElement] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!enabled || !element) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      onIntersect();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onIntersect();
        }
      },
      { rootMargin },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, enabled, onIntersect, rootMargin]);

  return setElement;
}

const FilterProductCard = React.memo(
  ({
    product,
    imageLoading,
    isDetailed,
    shouldUseCartUi,
    isAuthenticated,
    canManageContent,
    showParentCatalogHiddenStatus,
    quantity,
  }: FilterProductCardProps) => {
    const shouldShowParentHiddenStatus =
      showParentCatalogHiddenStatus &&
      product.status === ProductWithAttributesDtoStatus.HIDDEN;
    const shouldRenderCartUi =
      shouldUseCartUi && !shouldShowParentHiddenStatus;
    const shouldShowAdminActions =
      !shouldRenderCartUi && isAuthenticated && canManageContent;
    const card = (
      <ProductCardRuntime
        data={product}
        imageLoading={imageLoading}
        isDetailed={isDetailed}
        isIikoLinked={shouldShowAdminActions && isIikoProduct(product)}
        isMoySkladLinked={shouldShowAdminActions && isMoySkladProduct(product)}
        actions={
          shouldShowAdminActions && isDetailed ? (
            <EditProductCardAction
              isIikoLinked={isIikoProduct(product)}
              isMoySkladLinked={isMoySkladProduct(product)}
              productId={product.id}
              status={product.status}
            />
          ) : undefined
        }
        className={cn("flex-1", isDetailed && "min-h-[160px]")}
        pluginContainerClassName="flex-1"
        hidePriceWhenFooterAction={shouldRenderCartUi}
        reserveHeaderActionSpace={shouldRenderCartUi}
        footerAction={
          shouldRenderCartUi && quantity > 0 ? (
            <CartProductCardFooterAction
              product={product}
              isDetailed={isDetailed}
            />
          ) : shouldShowAdminActions ? (
            <ToggleProductPopularAction
              productId={product.id}
              isPopular={Boolean(product.isPopular)}
            />
          ) : undefined
        }
      />
    );

    return (
      <article className="relative flex flex-col">
        {shouldShowParentHiddenStatus ? (
          <div className="flex flex-1 flex-col">{card}</div>
        ) : (
          <ProductLink
            slug={product.slug}
            product={product}
            className="flex flex-1 flex-col"
          >
            {card}
          </ProductLink>
        )}
        {shouldRenderCartUi ? <CartProductAction product={product} /> : null}
        {shouldShowParentHiddenStatus ||
        (shouldShowAdminActions && !isDetailed) ? (
          <EditProductCardAction
            isIikoLinked={isIikoProduct(product)}
            isMoySkladLinked={isMoySkladProduct(product)}
            productId={product.id}
            status={product.status}
          />
        ) : null}
      </article>
    );
  },
);
FilterProductCard.displayName = "FilterProductCard";

function FilterProductSkeletons({
  count,
  isDetailed,
}: {
  count: number;
  isDetailed: boolean;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton
          key={`skeleton-${index}`}
          isDetailed={isDetailed}
        />
      ))}
    </>
  );
}

const FilterProductSection: React.FC<FilterProductSectionProps> = ({
  canManageContent,
  eagerFirstImages = false,
  emptyText,
  fetchNextPage,
  hasNextPage,
  heading,
  isAuthenticated,
  isDetailed,
  isFetchingNextPage,
  isLoading,
  productPages,
  products,
  quantityByProductId,
  sectionId,
  shouldUseCartUi,
  showParentCatalogHiddenStatus,
}) => {
  const listClassName = isDetailed
    ? PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME
    : PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME;
  const initialSkeletonCount = isDetailed
    ? DETAILED_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT
    : GRID_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT;
  const nextPageSkeletonCount = isDetailed
    ? DETAILED_FILTER_PRODUCTS_NEXT_PAGE_SKELETON_COUNT
    : GRID_FILTER_PRODUCTS_NEXT_PAGE_SKELETON_COUNT;
  const enableDomBudget =
    products.length >= FILTER_PRODUCTS_DOM_BUDGET_PRODUCT_COUNT;
  const getImageLoading = React.useCallback(
    (pageIndex: number, itemIndex: number) => {
      const eagerItemCount = isDetailed
        ? DETAILED_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT
        : GRID_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT;

      return eagerFirstImages && pageIndex === 0 && itemIndex < eagerItemCount
        ? ("eager" as const)
        : ("lazy" as const);
    },
    [eagerFirstImages, isDetailed],
  );
  const handleLoadNextPage = React.useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);
  const setNextPageElement = useIntersectionCallback({
    enabled: Boolean(
      productPages.length > 0 && hasNextPage && !isFetchingNextPage,
    ),
    onIntersect: handleLoadNextPage,
    rootMargin: FILTER_PRODUCTS_NEXT_PAGE_INTERSECTION_ROOT_MARGIN,
  });

  return (
    <section className="space-y-4">
      <h2
        id={sectionId}
        className="px-1 text-left text-xl font-bold"
        style={
          sectionId
            ? { scrollMarginTop: CATEGORY_SECTION_SCROLL_MARGIN_TOP }
            : undefined
        }
      >
        {heading}
      </h2>

      {isLoading ? (
        <div className={listClassName}>
          <FilterProductSkeletons
            count={initialSkeletonCount}
            isDetailed={isDetailed}
          />
        </div>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground flex min-h-18 items-center justify-center px-4 text-center text-sm">
          {emptyText}
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {productPages.map((pageProducts, pageIndex) => (
              <ProductDomBudgetContent
                key={`filter-page-${pageIndex}`}
                className={listClassName}
                enabled={enableDomBudget}
              >
                {pageProducts.map((product, itemIndex) => (
                  <FilterProductCard
                    key={product.id}
                    product={product}
                    imageLoading={getImageLoading(pageIndex, itemIndex)}
                    isDetailed={isDetailed}
                    shouldUseCartUi={shouldUseCartUi}
                    isAuthenticated={isAuthenticated}
                    canManageContent={canManageContent}
                    showParentCatalogHiddenStatus={
                      showParentCatalogHiddenStatus
                    }
                    quantity={quantityByProductId[product.id] ?? 0}
                  />
                ))}
              </ProductDomBudgetContent>
            ))}
            {isFetchingNextPage ? (
              <div className={listClassName}>
                <FilterProductSkeletons
                  count={nextPageSkeletonCount}
                  isDetailed={isDetailed}
                />
              </div>
            ) : null}
          </div>

          {hasNextPage ? (
            <div ref={setNextPageElement} aria-hidden className="h-px w-full" />
          ) : null}
        </>
      )}
    </section>
  );
};

export const FilterProducts: React.FC<FilterProductsProps> = ({
  className,
  queryState,
}) => {
  const { isDetailed } = useProductCardViewMode();
  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    productPages,
    products,
  } = useFilterProducts({
    queryState,
  });
  const {
    fetchNextPage: fetchRecommendationsNextPage,
    hasNextPage: hasRecommendationsNextPage,
    isFetchingNextPage: isFetchingRecommendationsNextPage,
    isLoading: isRecommendationsLoading,
    productPages: recommendedProductPages,
    products: recommendedProducts,
  } = useFilterRecommendations({
    queryState,
  });
  const { isAuthenticated } = useSession();
  const { catalog } = useCatalogState();
  const { quantityByProductId, shouldUseCartUi } = useCart();
  const canManageContent = canManageCatalogContent(catalog);
  const showParentCatalogHiddenStatus =
    isAuthenticated && isChildCatalog(catalog);

  return (
    <div
      id={FILTER_PRODUCTS_RESULTS_SECTION_ID}
      className={cn("space-y-7.5", className)}
      style={{ scrollMarginTop: CATEGORY_SECTION_SCROLL_MARGIN_TOP }}
    >
      <FilterProductSection
        canManageContent={canManageContent}
        eagerFirstImages
        emptyText="По вашему запросу ничего не найдено"
        fetchNextPage={fetchNextPage}
        hasNextPage={Boolean(hasNextPage)}
        heading="Результаты фильтра"
        isAuthenticated={isAuthenticated}
        isDetailed={isDetailed}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        productPages={productPages}
        products={products}
        quantityByProductId={quantityByProductId}
        showParentCatalogHiddenStatus={showParentCatalogHiddenStatus}
        shouldUseCartUi={shouldUseCartUi}
      />

      <FilterProductSection
        canManageContent={canManageContent}
        emptyText="Рекомендации не найдены"
        fetchNextPage={fetchRecommendationsNextPage}
        hasNextPage={Boolean(hasRecommendationsNextPage)}
        heading="Рекомендации"
        isAuthenticated={isAuthenticated}
        isDetailed={isDetailed}
        isFetchingNextPage={isFetchingRecommendationsNextPage}
        isLoading={isRecommendationsLoading}
        productPages={recommendedProductPages}
        products={recommendedProducts}
        quantityByProductId={quantityByProductId}
        showParentCatalogHiddenStatus={showParentCatalogHiddenStatus}
        shouldUseCartUi={shouldUseCartUi}
      />
    </div>
  );
};
