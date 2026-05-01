"use client";

import { useCart } from "@/core/modules/cart/model/cart-context";
import { CartProductAction } from "@/core/modules/cart/ui/cart-product-action";
import { CartProductCardFooterAction } from "@/core/modules/cart/ui/cart-product-card-footer-action";
import { ToggleProductPopularAction } from "@/core/modules/product/actions/ui";
import { ProductCard } from "@/core/modules/product/entities/product-card";
import { ProductCardSkeleton } from "@/core/modules/product/entities/product-card-skeleton";
import { ProductLink } from "@/core/modules/product/entities/product-link";
import { isMoySkladProduct } from "@/core/modules/product/model/moysklad-product";
import {
  PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME,
  PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME,
  useProductCardViewMode,
} from "@/core/modules/product/model/use-product-card-view-mode";
import { EditProductCardAction } from "@/core/widgets/edit-product-drawer/ui/edit-product-card-action";
import {
  DETAILED_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT,
  GRID_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT,
} from "@/core/widgets/filter-products/model/filter-products";
import { useFilterProducts } from "@/core/widgets/filter-products/model/use-filter-products";
import { useFilterRecommendations } from "@/core/widgets/filter-products/model/use-filter-recommendations";
import { type CatalogFilterQueryState } from "@/shared/lib/catalog-filter-query";
import { cn } from "@/shared/lib/utils";
import { useSession } from "@/shared/providers/session-provider";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import React from "react";

interface FilterProductsProps {
  className?: string;
  queryState: CatalogFilterQueryState;
}

type FilterSectionProduct = {
  id: string;
  slug: string;
} & React.ComponentProps<typeof ProductCard>["data"];

interface FilterProductListSectionProps {
  emptyText: string;
  heading: string;
  isDetailed: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  layoutVersion: string;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
  products: FilterSectionProduct[];
  sectionId?: string;
  sectionKey: string;
}

const PRODUCT_CARD_GRID_MIN_WIDTH_PX = 127;
const PRODUCT_CARD_GAP_PX = 16;
const GRID_VIRTUAL_ROW_ESTIMATE_FALLBACK_PX = 340;
const GRID_VIRTUAL_ROW_MAX_ESTIMATE_PX = 390;
const GRID_VIRTUAL_ROW_MIN_ESTIMATE_PX = 300;
const GRID_VIRTUAL_ROW_TEXT_ESTIMATE_PX = 136;
const DETAILED_VIRTUAL_ROW_ESTIMATE_PX = 220;
const FILTER_PRODUCTS_VIRTUAL_OVERSCAN = 4;
const FILTER_PRODUCTS_LOADER_ROW_KEY = "__loader__";

function createSkeletonKeys(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

interface FilterProductCardProps {
  product: FilterSectionProduct;
  isDetailed: boolean;
  shouldUseCartUi: boolean;
  isAuthenticated: boolean;
  quantity: number;
}

const FilterProductCard = React.memo(
  ({
    product,
    isDetailed,
    shouldUseCartUi,
    isAuthenticated,
    quantity,
  }: FilterProductCardProps) => (
    <article className="relative">
      <ProductLink
        slug={product.slug}
        product={product}
        className="block h-full"
      >
        <ProductCard
          data={product}
          isDetailed={isDetailed}
          actions={
            shouldUseCartUi ? (
              <CartProductAction product={product} />
            ) : isDetailed ? (
              <EditProductCardAction
                isMoySkladLinked={isMoySkladProduct(product)}
                productId={product.id}
                status={product.status}
              />
            ) : undefined
          }
          className={cn("h-full", isDetailed && "min-h-[160px]")}
          hidePriceWhenFooterAction={shouldUseCartUi}
          footerAction={
            shouldUseCartUi && quantity > 0 ? (
              <CartProductCardFooterAction
                product={product}
                isDetailed={isDetailed}
              />
            ) : !shouldUseCartUi && isAuthenticated ? (
              <ToggleProductPopularAction
                productId={product.id}
                isPopular={Boolean(product.isPopular)}
              />
            ) : undefined
          }
        />
      </ProductLink>
      {!shouldUseCartUi && !isDetailed ? (
        <EditProductCardAction
          isMoySkladLinked={isMoySkladProduct(product)}
          productId={product.id}
          status={product.status}
        />
      ) : null}
    </article>
  ),
);
FilterProductCard.displayName = "FilterProductCard";

const FilterProductListSection: React.FC<FilterProductListSectionProps> = ({
  emptyText,
  heading,
  isDetailed,
  isFetchingNextPage,
  isLoading,
  layoutVersion,
  loadMoreRef,
  products,
  sectionId,
  sectionKey,
}) => {
  const { isAuthenticated } = useSession();
  const { quantityByProductId, shouldUseCartUi } = useCart();
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [listWidth, setListWidth] = React.useState(0);
  const [scrollMargin, setScrollMargin] = React.useState(0);
  const listClassName = React.useMemo(
    () =>
      isDetailed
        ? PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME
        : PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME,
    [isDetailed],
  );
  const initialSkeletonKeys = React.useMemo(
    () =>
      createSkeletonKeys(
        isDetailed
          ? DETAILED_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT
          : GRID_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT,
      ),
    [isDetailed],
  );
  const columns = React.useMemo(() => {
    if (isDetailed) {
      return 1;
    }

    if (listWidth <= 0) {
      return 1;
    }

    return Math.max(
      1,
      Math.floor(
        (listWidth + PRODUCT_CARD_GAP_PX) /
          (PRODUCT_CARD_GRID_MIN_WIDTH_PX + PRODUCT_CARD_GAP_PX),
      ),
    );
  }, [isDetailed, listWidth]);
  const productRows = React.useMemo(() => {
    const rows: FilterSectionProduct[][] = [];

    for (let index = 0; index < products.length; index += columns) {
      rows.push(products.slice(index, index + columns));
    }

    return rows;
  }, [columns, products]);
  const loaderSkeletonCount = isDetailed ? 1 : Math.max(1, columns);
  const rowEstimateSize = React.useMemo(() => {
    if (isDetailed) {
      return DETAILED_VIRTUAL_ROW_ESTIMATE_PX;
    }

    if (listWidth <= 0) {
      return GRID_VIRTUAL_ROW_ESTIMATE_FALLBACK_PX;
    }

    const columnWidth =
      (listWidth - PRODUCT_CARD_GAP_PX * Math.max(0, columns - 1)) / columns;
    const estimatedHeight =
      Math.ceil(columnWidth * (4 / 3)) + GRID_VIRTUAL_ROW_TEXT_ESTIMATE_PX;

    return Math.min(
      GRID_VIRTUAL_ROW_MAX_ESTIMATE_PX,
      Math.max(GRID_VIRTUAL_ROW_MIN_ESTIMATE_PX, estimatedHeight),
    );
  }, [columns, isDetailed, listWidth]);
  const isVirtualizerEnabled = !isLoading && products.length > 0;
  const measureList = React.useCallback(() => {
    const list = listRef.current;

    if (!list || typeof window === "undefined") {
      return;
    }

    const nextListWidth = list.clientWidth;
    const nextScrollMargin = Math.max(
      0,
      Math.round(list.getBoundingClientRect().top + window.scrollY),
    );

    setListWidth((previousValue) =>
      previousValue === nextListWidth ? previousValue : nextListWidth,
    );
    setScrollMargin((previousValue) =>
      previousValue === nextScrollMargin ? previousValue : nextScrollMargin,
    );
  }, []);

  React.useLayoutEffect(() => {
    measureList();
  }, [isDetailed, layoutVersion, measureList, products.length]);

  React.useEffect(() => {
    const list = listRef.current;

    if (!list || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(measureList);

    observer.observe(list);

    return () => {
      observer.disconnect();
    };
  }, [measureList]);

  React.useEffect(() => {
    if (!isVirtualizerEnabled || typeof window === "undefined") {
      return;
    }

    window.addEventListener("resize", measureList);

    return () => {
      window.removeEventListener("resize", measureList);
    };
  }, [isVirtualizerEnabled, measureList]);

  const getVirtualRowKey = React.useCallback(
    (index: number) => {
      const rowItems = productRows[index];

      if (rowItems) {
        return `${sectionKey}:${rowItems[0].id}`;
      }

      return `${sectionKey}:${FILTER_PRODUCTS_LOADER_ROW_KEY}:${index}`;
    },
    [productRows, sectionKey],
  );

  const rowVirtualizer = useWindowVirtualizer({
    count: productRows.length + (isFetchingNextPage ? 1 : 0),
    estimateSize: React.useCallback(() => rowEstimateSize, [rowEstimateSize]),
    overscan: FILTER_PRODUCTS_VIRTUAL_OVERSCAN,
    scrollMargin,
    gap: PRODUCT_CARD_GAP_PX,
    enabled: isVirtualizerEnabled,
    getItemKey: getVirtualRowKey,
    useFlushSync: false,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();

  React.useEffect(() => {
    rowVirtualizer.measure();
  }, [rowVirtualizer]);

  return (
    <div id={sectionId} className="space-y-6">
      <h2 className="pl-1 text-left text-xl font-bold">{heading}</h2>

      {isLoading ? (
        <ul className={listClassName}>
          {initialSkeletonKeys.map((index) => (
            <ProductCardSkeleton
              key={`${heading}-initial-${index}`}
              isDetailed={isDetailed}
            />
          ))}
        </ul>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground text-center text-sm">{emptyText}</p>
      ) : (
        <>
          <div ref={listRef} style={{ overflowAnchor: "none" }}>
            <div
              className="relative w-full"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {virtualRows.map((virtualRow) => {
                const rowItems = productRows[virtualRow.index];
                const isLoaderRow = !rowItems;

                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className="absolute top-0 left-0 w-full"
                    style={{
                      transform: `translateY(${
                        virtualRow.start - rowVirtualizer.options.scrollMargin
                      }px)`,
                    }}
                  >
                    {isLoaderRow ? (
                      <div
                        className="grid gap-4"
                        style={{
                          gridTemplateColumns: `repeat(${loaderSkeletonCount}, minmax(0, 1fr))`,
                        }}
                      >
                        {Array.from(
                          { length: loaderSkeletonCount },
                          (_, index) => (
                            <ProductCardSkeleton
                              key={`${sectionKey}-next-${index}`}
                              isDetailed={isDetailed}
                            />
                          ),
                        )}
                      </div>
                    ) : (
                      <div
                        className="grid gap-4"
                        style={{
                          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                        }}
                      >
                        {rowItems.map((product) => (
                          <FilterProductCard
                            key={product.id}
                            product={product}
                            isDetailed={isDetailed}
                            shouldUseCartUi={shouldUseCartUi}
                            isAuthenticated={isAuthenticated}
                            quantity={quantityByProductId[product.id] ?? 0}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div ref={loadMoreRef} aria-hidden className="h-px w-full" />
        </>
      )}
    </div>
  );
};

export const FilterProducts: React.FC<FilterProductsProps> = ({
  className,
  queryState,
}) => {
  const { isDetailed } = useProductCardViewMode();
  const { isFetchingNextPage, isLoading, loadMoreRef, products } =
    useFilterProducts({
      queryState,
    });
  const {
    isFetchingNextPage: isFetchingRecommendationsNextPage,
    isLoading: isRecommendationsLoading,
    loadMoreRef: recommendationsLoadMoreRef,
    products: recommendedProducts,
  } = useFilterRecommendations({
    queryState,
  });
  const layoutVersion = React.useMemo(
    () =>
      [
        products.length,
        recommendedProducts.length,
        Number(isLoading),
        Number(isFetchingNextPage),
        Number(isRecommendationsLoading),
        Number(isFetchingRecommendationsNextPage),
      ].join(":"),
    [
      isFetchingNextPage,
      isFetchingRecommendationsNextPage,
      isLoading,
      isRecommendationsLoading,
      products.length,
      recommendedProducts.length,
    ],
  );

  return (
    <div className={cn("space-y-6", className)}>
      <FilterProductListSection
        sectionKey="filter-results"
        heading="Результаты фильтра"
        emptyText="По вашему запросу ничего не найдено"
        isDetailed={isDetailed}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        layoutVersion={layoutVersion}
        loadMoreRef={loadMoreRef}
        products={products}
      />
      <FilterProductListSection
        sectionKey="filter-recommendations"
        heading="Рекомендации"
        emptyText="Рекомендации не найдены"
        isDetailed={isDetailed}
        isFetchingNextPage={isFetchingRecommendationsNextPage}
        isLoading={isRecommendationsLoading}
        layoutVersion={layoutVersion}
        loadMoreRef={recommendationsLoadMoreRef}
        products={recommendedProducts}
      />
    </div>
  );
};
