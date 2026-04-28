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
  CategoryDto,
  ProductWithAttributesDto,
  categoryControllerGetProductCardsByCategory,
  getProductControllerGetUncategorizedInfiniteCardsQueryKey,
  productControllerGetUncategorizedInfiniteCards,
} from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import { useSession } from "@/shared/providers/session-provider";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useIsIOS } from "@/shared/lib/use-ios-scroll-fix";
import React from "react";

interface CategoryProductsProps {
  className?: string;
  category: CategoryDto;
  sectionId: string;
  initiallyActivated?: boolean;
  forceActivation?: boolean;
  allowActivation?: boolean;
  allowLoadMore?: boolean;
}

interface UncategorizedProductsProps {
  className?: string;
  sectionId: string;
  initiallyActivated?: boolean;
  forceActivation?: boolean;
  allowActivation?: boolean;
  allowLoadMore?: boolean;
}

interface ProductSectionItem {
  categoryId?: string;
  categoryPosition?: number;
  key: string;
  product: ProductWithAttributesDto;
}

interface ProductSectionPage {
  items: ProductSectionItem[];
  nextCursor: string | null;
}

interface ProductSectionProps {
  className?: string;
  title: string;
  sectionId: string;
  queryKey: readonly unknown[];
  queryFn: (cursor: string | undefined) => Promise<ProductSectionPage>;
  initiallyActivated?: boolean;
  forceActivation?: boolean;
  allowActivation?: boolean;
  allowLoadMore?: boolean;
  hideWhenEmpty?: boolean;
}

export const CATEGORY_PRODUCTS_PAGE_SIZE = 32;
export const UNCATEGORIZED_PRODUCTS_SECTION_ID =
  "uncategorized-products-section";
const GRID_INITIAL_SKELETON_ITEMS_COUNT = CATEGORY_PRODUCTS_PAGE_SIZE / 2;
const DETAILED_INITIAL_SKELETON_ITEMS_COUNT = 8;
const PRODUCT_CARD_GRID_MIN_WIDTH_PX = 127;
const PRODUCT_CARD_GAP_PX = 16;
const GRID_VIRTUAL_ROW_ESTIMATE_PX = 390;
const DETAILED_VIRTUAL_ROW_ESTIMATE_PX = 220;
const PRODUCT_SECTION_VIRTUAL_OVERSCAN = 4;
const PRODUCT_SECTION_VIRTUAL_OVERSCAN_IOS = 10;
const PRODUCT_SECTION_LOADER_ROW_KEY = "__loader__";
const UNCATEGORIZED_QUERY_PARAMS = {
  limit: String(CATEGORY_PRODUCTS_PAGE_SIZE),
};

const ProductSection: React.FC<ProductSectionProps> = ({
  className,
  title,
  sectionId,
  queryKey,
  queryFn,
  initiallyActivated = false,
  forceActivation = false,
  allowActivation = true,
  allowLoadMore = true,
  hideWhenEmpty = false,
}) => {
  const { isDetailed, hasHydrated } = useProductCardViewMode();
  const { isAuthenticated } = useSession();
  const { shouldUseCartUi } = useCart();
  const isIOS = useIsIOS();
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [isActivated, setIsActivated] = React.useState(initiallyActivated);
  const [listWidth, setListWidth] = React.useState(0);
  const [scrollMargin, setScrollMargin] = React.useState(0);

  React.useEffect(() => {
    if (!initiallyActivated || isActivated) {
      return;
    }

    setIsActivated(true);
  }, [initiallyActivated, isActivated]);

  React.useEffect(() => {
    if (!forceActivation || isActivated) {
      return;
    }

    setIsActivated(true);
  }, [forceActivation, isActivated]);

  React.useEffect(() => {
    if (isActivated) {
      return;
    }

    if (!allowActivation) {
      return;
    }

    const heading = headingRef.current;

    if (!heading) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setIsActivated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsActivated(true);
          observer.disconnect();
        }
      },
      { rootMargin: "260px 0px" },
    );

    observer.observe(heading);

    return () => {
      observer.disconnect();
    };
  }, [allowActivation, isActivated]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey,
      queryFn: ({ pageParam }) => queryFn(pageParam as string | undefined),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage: ProductSectionPage) =>
        lastPage.nextCursor ?? undefined,
      enabled: isActivated,
    });

  const hasLoadedFirstPage = Boolean(data?.pages?.length);
  const products = React.useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
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
    const rows: ProductSectionItem[][] = [];

    for (let index = 0; index < products.length; index += columns) {
      rows.push(products.slice(index, index + columns));
    }

    return rows;
  }, [columns, products]);
  const shouldRenderLoaderRow = allowLoadMore && hasNextPage;
  const loaderSkeletonCount = isDetailed ? 1 : Math.max(1, columns);
  const rowEstimateSize = isDetailed
    ? DETAILED_VIRTUAL_ROW_ESTIMATE_PX
    : GRID_VIRTUAL_ROW_ESTIMATE_PX;
  const isVirtualizerEnabled =
    isActivated &&
    hasLoadedFirstPage &&
    (productRows.length > 0 || shouldRenderLoaderRow);
  const listClassName = isDetailed
    ? PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME
    : PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME;
  const initialSkeletonCount = isDetailed
    ? DETAILED_INITIAL_SKELETON_ITEMS_COUNT
    : GRID_INITIAL_SKELETON_ITEMS_COUNT;
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
  }, [hasLoadedFirstPage, isDetailed, measureList, products.length]);

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
        const firstItem = rowItems[0];
        const resolvedRowKey =
          firstItem?.key ?? firstItem?.product.id ?? `row-${index}`;

        return `${sectionId}:${resolvedRowKey}:${index}`;
      }

      return `${sectionId}:${PRODUCT_SECTION_LOADER_ROW_KEY}:${index}`;
    },
    [productRows, sectionId],
  );

  const rowVirtualizer = useWindowVirtualizer({
    count: productRows.length + (shouldRenderLoaderRow ? 1 : 0),
    estimateSize: React.useCallback(() => rowEstimateSize, [rowEstimateSize]),
    overscan: isIOS ? PRODUCT_SECTION_VIRTUAL_OVERSCAN_IOS : PRODUCT_SECTION_VIRTUAL_OVERSCAN,
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

  const renderProductCard = React.useCallback(
    (
      { key, product, categoryId, categoryPosition }: ProductSectionItem,
      itemIndex: number,
    ) => (
      <article
        key={`${sectionId}:${categoryPosition ?? "na"}:${key ?? product.id}:${itemIndex}`}
        className="relative"
      >
        <ProductLink slug={product.slug} product={product} className="block h-full">
          <ProductCard
            data={product}
            isDetailed={isDetailed}
            actions={
              shouldUseCartUi ? (
                <CartProductAction product={product} />
              ) : isDetailed ? (
                <EditProductCardAction
                  categoryId={categoryId}
                  categoryPosition={categoryPosition}
                  isMoySkladLinked={isMoySkladProduct(product)}
                  productId={product.id}
                  status={product.status}
                />
              ) : undefined
            }
            className={cn("h-full", isDetailed && "min-h-[160px]")}
            hidePriceWhenFooterAction={shouldUseCartUi}
            footerAction={
              shouldUseCartUi ? (
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
            categoryId={categoryId}
            categoryPosition={categoryPosition}
            isMoySkladLinked={isMoySkladProduct(product)}
            productId={product.id}
            status={product.status}
          />
        ) : null}
      </article>
    ),
    [
      isAuthenticated,
      isDetailed,
      sectionId,
      shouldUseCartUi,
    ],
  );

  React.useEffect(() => {
    const lastVisibleRow = virtualRows[virtualRows.length - 1];

    if (
      !allowLoadMore ||
      !isActivated ||
      !hasNextPage ||
      isFetchingNextPage ||
      !lastVisibleRow
    ) {
      return;
    }

    if (lastVisibleRow.index >= productRows.length - 1) {
      void fetchNextPage();
    }
  }, [
    allowLoadMore,
    fetchNextPage,
    hasNextPage,
    isActivated,
    isFetchingNextPage,
    productRows.length,
    virtualRows,
  ]);

  if (hideWhenEmpty && hasLoadedFirstPage && products.length === 0) {
    return null;
  }

  return (
    <div id={sectionId} className={cn("space-y-7.5 min-h-90", className)}>
      <h2 ref={headingRef} className="pl-1 text-left text-xl font-bold">
        {title}
      </h2>
      <div ref={listRef} style={{ overflowAnchor: "none" }}>
        {!hasLoadedFirstPage ? (
          hasHydrated ? (
            <ul className={listClassName}>
              {Array.from({ length: initialSkeletonCount }, (_, index) => (
                <ProductCardSkeleton
                  key={`initial-skeleton-${index}`}
                  isDetailed={isDetailed}
                />
              ))}
            </ul>
          ) : null
        ) : (
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
                    isFetchingNextPage ? (
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
                              key={`next-page-${index}`}
                              isDetailed={isDetailed}
                            />
                          ),
                        )}
                      </div>
                    ) : (
                      <div aria-hidden className="h-px w-full" />
                    )
                  ) : (
                    <div
                      className="grid gap-4"
                      style={{
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                      }}
                    >
                      {rowItems.map(renderProductCard)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div aria-hidden className="h-px w-full" />
    </div>
  );
};

export const CategoryProducts: React.FC<CategoryProductsProps> = ({
  className,
  category,
  sectionId,
  initiallyActivated = false,
  forceActivation = false,
  allowActivation = true,
  allowLoadMore = true,
}) => {
  const queryKey = React.useMemo(
    () =>
      [
        "category-products-infinite",
        category.id,
        CATEGORY_PRODUCTS_PAGE_SIZE,
      ] as const,
    [category.id],
  );

  const queryFn = React.useCallback(
    async (cursor: string | undefined): Promise<ProductSectionPage> => {
      const page = await categoryControllerGetProductCardsByCategory(
        category.id,
        {
          cursor,
          limit: CATEGORY_PRODUCTS_PAGE_SIZE,
        },
      );

      return {
        nextCursor: page.nextCursor,
        items: page.items.map(({ productId, product, position }) => ({
          categoryId: category.id,
          categoryPosition: position,
          key: productId ?? product.id,
          product,
        })),
      };
    },
    [category.id],
  );

  return (
    <ProductSection
      className={className}
      title={category.name}
      sectionId={sectionId}
      queryKey={queryKey}
      queryFn={queryFn}
      initiallyActivated={initiallyActivated}
      forceActivation={forceActivation}
      allowActivation={allowActivation}
      allowLoadMore={allowLoadMore}
    />
  );
};

export const UncategorizedProducts: React.FC<UncategorizedProductsProps> = ({
  className,
  sectionId,
  initiallyActivated = false,
  forceActivation = false,
  allowActivation = true,
  allowLoadMore = true,
}) => {
  const queryKey = React.useMemo(
    () =>
      getProductControllerGetUncategorizedInfiniteCardsQueryKey(
        UNCATEGORIZED_QUERY_PARAMS,
      ),
    [],
  );

  const queryFn = React.useCallback(
    async (cursor: string | undefined): Promise<ProductSectionPage> => {
      const page = await productControllerGetUncategorizedInfiniteCards({
        ...UNCATEGORIZED_QUERY_PARAMS,
        cursor,
      });

      return {
        nextCursor: page.nextCursor,
        items: page.items.map((product) => ({
          key: product.id,
          product,
        })),
      };
    },
    [],
  );

  return (
    <ProductSection
      className={className}
      title="Остальное"
      sectionId={sectionId}
      queryKey={queryKey}
      queryFn={queryFn}
      initiallyActivated={initiallyActivated}
      forceActivation={forceActivation}
      allowActivation={allowActivation}
      allowLoadMore={allowLoadMore}
      hideWhenEmpty
    />
  );
};
