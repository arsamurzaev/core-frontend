"use client";

import {
  CATEGORY_SECTION_SCROLL_MARGIN_TOP,
  FILTER_PRODUCTS_RESULTS_SECTION_ID,
  getCategorySectionScrollOffset,
} from "@/core/modules/browser/model/category-scroll";
import { useCart } from "@/core/modules/cart/model/cart-context";
import { CartProductAction } from "@/core/modules/cart/ui/cart-product-action";
import { CartProductCardFooterAction } from "@/core/modules/cart/ui/cart-product-card-footer-action";
import { ProductCardRuntime } from "@/core/catalog-runtime/ui";
import { ToggleProductPopularAction } from "@/core/modules/product/actions/ui";
import { ProductCardSkeleton } from "@/core/modules/product/entities/product-card-skeleton";
import { ProductLink } from "@/core/modules/product/entities/product-link";
import { isMoySkladProduct } from "@/core/modules/product/model/moysklad-product";
import { useProductCardViewMode } from "@/core/modules/product/model/use-product-card-view-mode";
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
} & React.ComponentProps<typeof ProductCardRuntime>["data"];

const PRODUCT_CARD_GRID_MIN_WIDTH_PX = 127;
const PRODUCT_CARD_GAP_PX = 16;
const GRID_VIRTUAL_ROW_ESTIMATE_FALLBACK_PX = 380;
const GRID_VIRTUAL_ROW_MAX_ESTIMATE_PX = 390;
const GRID_VIRTUAL_ROW_MIN_ESTIMATE_PX = 340;
const GRID_VIRTUAL_ROW_TEXT_ESTIMATE_PX = 124;
const DETAILED_VIRTUAL_ROW_ESTIMATE_PX = 220;
const FILTER_PRODUCTS_HEADING_ROW_ESTIMATE_PX = 40;
const FILTER_PRODUCTS_EMPTY_ROW_ESTIMATE_PX = 72;
const FILTER_PRODUCTS_VIRTUAL_OVERSCAN = 2;

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
    <article className="relative h-full">
      <ProductLink
        slug={product.slug}
        product={product}
        className="block h-full"
      >
        <ProductCardRuntime
          data={product}
          isDetailed={isDetailed}
          isMoySkladLinked={
            !shouldUseCartUi &&
            isAuthenticated &&
            isMoySkladProduct(product)
          }
          actions={
            !shouldUseCartUi && isDetailed ? (
              <EditProductCardAction
                isMoySkladLinked={isMoySkladProduct(product)}
                productId={product.id}
                status={product.status}
              />
            ) : undefined
          }
          className={cn("h-full", isDetailed && "min-h-[160px]")}
          pluginContainerClassName="h-full"
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
      {shouldUseCartUi ? <CartProductAction product={product} /> : null}
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

interface FilterProductVirtualSection {
  emptyText: string;
  fetchNextPage: () => unknown;
  hasNextPage: boolean;
  heading: string;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  products: FilterSectionProduct[];
  sectionId?: string;
  sectionKey: string;
}

type FilterProductVirtualRow =
  | {
      key: string;
      section: FilterProductVirtualSection;
      type: "heading";
    }
  | {
      key: string;
      skeletonCount: number;
      type: "initial-skeleton";
    }
  | {
      key: string;
      section: FilterProductVirtualSection;
      type: "empty";
    }
  | {
      endProductIndex: number;
      items: FilterSectionProduct[];
      key: string;
      section: FilterProductVirtualSection;
      startProductIndex: number;
      type: "products";
    }
  | {
      key: string;
      section: FilterProductVirtualSection;
      skeletonCount: number;
      type: "loader";
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
    products,
  } = useFilterProducts({
    queryState,
  });
  const {
    fetchNextPage: fetchRecommendationsNextPage,
    hasNextPage: hasRecommendationsNextPage,
    isFetchingNextPage: isFetchingRecommendationsNextPage,
    isLoading: isRecommendationsLoading,
    products: recommendedProducts,
  } = useFilterRecommendations({
    queryState,
  });
  const { isAuthenticated } = useSession();
  const { quantityByProductId, shouldUseCartUi } = useCart();
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const requestedNextPageSectionKeysRef = React.useRef(new Set<string>());
  const [listWidth, setListWidth] = React.useState(0);
  const [scrollMargin, setScrollMargin] = React.useState(0);
  const [scrollPaddingStart, setScrollPaddingStart] = React.useState(0);
  const columns = React.useMemo(() => {
    if (isDetailed || listWidth <= 0) {
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
  const productRowEstimateSize = React.useMemo(() => {
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
  const skeletonCount = isDetailed
    ? DETAILED_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT
    : GRID_FILTER_PRODUCTS_INITIAL_SKELETON_COUNT;
  const sections = React.useMemo<FilterProductVirtualSection[]>(
    () => [
      {
        emptyText: "По вашему запросу ничего не найдено",
        fetchNextPage,
        hasNextPage: Boolean(hasNextPage),
        heading: "Результаты фильтра",
        isFetchingNextPage,
        isLoading,
        products,
        sectionKey: "filter-results",
      },
      {
        emptyText: "Рекомендации не найдены",
        fetchNextPage: fetchRecommendationsNextPage,
        hasNextPage: Boolean(hasRecommendationsNextPage),
        heading: "Рекомендации",
        isFetchingNextPage: isFetchingRecommendationsNextPage,
        isLoading: isRecommendationsLoading,
        products: recommendedProducts,
        sectionKey: "filter-recommendations",
      },
    ],
    [
      fetchNextPage,
      fetchRecommendationsNextPage,
      hasNextPage,
      hasRecommendationsNextPage,
      isFetchingNextPage,
      isFetchingRecommendationsNextPage,
      isLoading,
      isRecommendationsLoading,
      products,
      recommendedProducts,
    ],
  );
  const rows = React.useMemo<FilterProductVirtualRow[]>(() => {
    const nextRows: FilterProductVirtualRow[] = [];

    sections.forEach((section) => {
      nextRows.push({
        key: `${section.sectionKey}:heading`,
        section,
        type: "heading",
      });

      if (section.isLoading) {
        for (let index = 0; index < skeletonCount; index += columns) {
          nextRows.push({
            key: `${section.sectionKey}:initial-skeleton:${Math.floor(
              index / columns,
            )}`,
            skeletonCount: Math.min(columns, skeletonCount - index),
            type: "initial-skeleton",
          });
        }

        return;
      }

      if (section.products.length === 0) {
        nextRows.push({
          key: `${section.sectionKey}:empty`,
          section,
          type: "empty",
        });
        return;
      }

      for (let index = 0; index < section.products.length; index += columns) {
        const endProductIndex = Math.min(
          index + columns,
          section.products.length,
        );

        nextRows.push({
          endProductIndex,
          items: section.products.slice(index, endProductIndex),
          key: `${section.sectionKey}:products:${Math.floor(index / columns)}`,
          section,
          startProductIndex: index,
          type: "products",
        });
      }

      if (section.isFetchingNextPage) {
        nextRows.push({
          key: `${section.sectionKey}:loader`,
          section,
          skeletonCount: Math.max(1, columns),
          type: "loader",
        });
      }
    });

    return nextRows;
  }, [columns, sections, skeletonCount]);
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
    const nextScrollPaddingStart = getCategorySectionScrollOffset();

    setListWidth((previousValue) =>
      previousValue === nextListWidth ? previousValue : nextListWidth,
    );
    setScrollMargin((previousValue) =>
      previousValue === nextScrollMargin ? previousValue : nextScrollMargin,
    );
    setScrollPaddingStart((previousValue) =>
      previousValue === nextScrollPaddingStart
        ? previousValue
        : nextScrollPaddingStart,
    );
  }, []);

  React.useLayoutEffect(() => {
    measureList();
  }, [isDetailed, measureList, rows.length]);

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
    if (typeof window === "undefined") {
      return;
    }

    window.addEventListener("resize", measureList);

    return () => {
      window.removeEventListener("resize", measureList);
    };
  }, [measureList]);

  const estimateRowSize = React.useCallback(
    (index: number) => {
      const row = rows[index];

      if (!row) {
        return productRowEstimateSize;
      }

      if (row.type === "heading") {
        return FILTER_PRODUCTS_HEADING_ROW_ESTIMATE_PX;
      }

      if (row.type === "empty") {
        return FILTER_PRODUCTS_EMPTY_ROW_ESTIMATE_PX;
      }

      return productRowEstimateSize;
    },
    [productRowEstimateSize, rows],
  );
  const getVirtualRowKey = React.useCallback(
    (index: number) => rows[index]?.key ?? `filter-row-${index}`,
    [rows],
  );
  const gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
  const rowVirtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: estimateRowSize,
    overscan: FILTER_PRODUCTS_VIRTUAL_OVERSCAN,
    scrollMargin,
    scrollPaddingStart,
    gap: PRODUCT_CARD_GAP_PX,
    enabled: rows.length > 0,
    getItemKey: getVirtualRowKey,
    useFlushSync: false,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();

  React.useEffect(() => {
    rowVirtualizer.measure();
  }, [columns, isDetailed, rowVirtualizer, rows.length]);

  React.useEffect(() => {
    sections.forEach((section) => {
      if (!section.isFetchingNextPage) {
        requestedNextPageSectionKeysRef.current.delete(section.sectionKey);
      }
    });
  }, [sections]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const fetchTop = window.scrollY + scrollPaddingStart;
    const fetchBottom =
      window.scrollY + window.innerHeight + productRowEstimateSize * 2;

    virtualRows.forEach((virtualRow) => {
      if (virtualRow.end < fetchTop || virtualRow.start > fetchBottom) {
        return;
      }

      const row = rows[virtualRow.index];

      if (!row || (row.type !== "products" && row.type !== "loader")) {
        return;
      }

      const section = row.section;
      const shouldFetchNextPage =
        row.type === "loader" ||
        row.endProductIndex >= section.products.length - columns;

      if (
        shouldFetchNextPage &&
        section.hasNextPage &&
        !section.isFetchingNextPage &&
        !requestedNextPageSectionKeysRef.current.has(section.sectionKey)
      ) {
        requestedNextPageSectionKeysRef.current.add(section.sectionKey);
        void section.fetchNextPage();
      }
    });
  }, [
    columns,
    productRowEstimateSize,
    rows,
    scrollPaddingStart,
    virtualRows,
  ]);
  const renderRowContent = (row: FilterProductVirtualRow) => {
    if (row.type === "heading") {
      return (
        <h2
          id={row.section.sectionId}
          className="px-1 pt-1 pb-3 text-left text-xl font-bold"
          style={
            row.section.sectionId
              ? { scrollMarginTop: CATEGORY_SECTION_SCROLL_MARGIN_TOP }
              : undefined
          }
        >
          {row.section.heading}
        </h2>
      );
    }

    if (row.type === "empty") {
      return (
        <p className="text-muted-foreground flex h-full min-h-12 items-center justify-center px-4 text-center text-sm">
          {row.section.emptyText}
        </p>
      );
    }

    if (row.type === "initial-skeleton" || row.type === "loader") {
      return (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns,
            height: productRowEstimateSize,
          }}
        >
          {Array.from({ length: row.skeletonCount }, (_, index) => (
            <ProductCardSkeleton
              key={`${row.key}:${index}`}
              isDetailed={isDetailed}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns,
          height: productRowEstimateSize,
        }}
      >
        {row.items.map((product) => (
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
    );
  };

  return (
    <div
      id={FILTER_PRODUCTS_RESULTS_SECTION_ID}
      ref={listRef}
      className={cn("relative w-full", className)}
      style={{
        overflowAnchor: "none",
        scrollMarginTop: CATEGORY_SECTION_SCROLL_MARGIN_TOP,
      }}
    >
      <div
        className="relative w-full"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];

          if (!row) {
            return null;
          }

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
              {renderRowContent(row)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
