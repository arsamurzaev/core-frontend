"use client";

import { ProductCardRuntime } from "@/core/catalog-runtime/ui";
import {
  CATEGORY_SECTION_SCROLL_MARGIN_TOP,
  getCategorySectionId,
  getCategorySectionScrollOffset,
  getCategorySectionScrollTargetOffset,
  registerCategorySectionScroller,
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
  ProductLink,
  scrollWindowWithStableProductCardMeasurements,
  ToggleProductPopularAction,
  useProductCardVirtualGridLayout,
  useProductCardViewMode,
} from "@/core/modules/product";
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
import {
  type Virtualizer,
  useWindowVirtualizer,
} from "@tanstack/react-virtual";
import React from "react";

interface VirtualizedCategoryProductsProps {
  categories: CategoryDto[];
  className?: string;
  activationBlockedCategoryId?: string | null;
  forceActivatedCategoryId?: string | null;
  ignoreKnownProductCount?: boolean;
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

export const CATEGORY_PRODUCTS_PAGE_SIZE = 32;
export const UNCATEGORIZED_PRODUCTS_SECTION_ID =
  "uncategorized-products-section";
const UNCATEGORIZED_SECTION_KEY = "__uncategorized__";
const GRID_INITIAL_SKELETON_ITEMS_COUNT = 4;
const DETAILED_INITIAL_SKELETON_ITEMS_COUNT = 2;
const CATEGORY_HEADING_COMPACT_ROW_ESTIMATE_PX = 36;
const CATEGORY_HEADING_TALL_ROW_ESTIMATE_PX = 60;
const CATEGORY_SECTION_TOP_GAP_PX = 8;
const EMPTY_CATEGORY_ROW_HEIGHT_PX = 160;
const VIRTUAL_CATEGORY_PRODUCTS_OVERSCAN = 2;
const CATEGORY_SCROLL_ALIGNMENT_FRAME_COUNT = 8;
const UNCATEGORIZED_QUERY_PARAMS = {
  limit: String(CATEGORY_PRODUCTS_PAGE_SIZE),
};

interface ProductSectionCardProps {
  item: ProductSectionItem;
  isDetailed: boolean;
  shouldUseCartUi: boolean;
  isAuthenticated: boolean;
}

const ProductSectionCard = React.memo(
  ({
    item,
    isDetailed,
    shouldUseCartUi,
    isAuthenticated,
  }: ProductSectionCardProps) => {
    const { product, categoryId, categoryPosition } = item;
    return (
      <article className="relative h-full">
        <ProductLink
          slug={product.slug}
          product={product}
          className="block h-full"
        >
          <ProductCardRuntime
            data={product}
            imageLoading="eager"
            isDetailed={isDetailed}
            isIikoLinked={
              !shouldUseCartUi && isAuthenticated && isIikoProduct(product)
            }
            isMoySkladLinked={
              !shouldUseCartUi && isAuthenticated && isMoySkladProduct(product)
            }
            actions={
              !shouldUseCartUi && isDetailed ? (
                <EditProductCardAction
                  categoryId={categoryId}
                  categoryPosition={categoryPosition}
                  isIikoLinked={isIikoProduct(product)}
                  isMoySkladLinked={isMoySkladProduct(product)}
                  productId={product.id}
                  status={product.status}
                />
              ) : undefined
            }
            className={cn("h-full", isDetailed && "min-h-[160px]")}
            pluginContainerClassName="h-full"
            hidePriceWhenFooterAction={shouldUseCartUi}
            reserveHeaderActionSpace={shouldUseCartUi}
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
        {shouldUseCartUi ? <CartProductAction product={product} /> : null}
        {!shouldUseCartUi && !isDetailed ? (
          <EditProductCardAction
            categoryId={categoryId}
            categoryPosition={categoryPosition}
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
ProductSectionCard.displayName = "ProductSectionCard";

function CategorySectionHeading({
  height,
  id,
  topGap,
  title,
}: {
  height: number;
  id: string;
  topGap: number;
  title: string;
}) {
  return (
    <h2
      id={id}
      className="px-1 text-left"
      style={{
        height,
        paddingTop: topGap + 4,
        scrollMarginTop: CATEGORY_SECTION_SCROLL_MARGIN_TOP,
      }}
    >
      <span className="line-clamp-2 text-lg leading-tight font-bold text-foreground [overflow-wrap:anywhere] sm:text-xl">
        {title}
      </span>
    </h2>
  );
}

function getCategoryHeadingRowEstimate(
  title: string,
  listWidth: number,
): number {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    return CATEGORY_HEADING_COMPACT_ROW_ESTIMATE_PX;
  }

  const availableCharacters =
    listWidth > 0 ? Math.max(18, Math.floor((listWidth - 8) / 8.5)) : 26;

  return normalizedTitle.length > availableCharacters
    ? CATEGORY_HEADING_TALL_ROW_ESTIMATE_PX
    : CATEGORY_HEADING_COMPACT_ROW_ESTIMATE_PX;
}

interface VirtualProductSectionDefinition {
  categoryId?: string;
  hideWhenEmpty?: boolean;
  key: string;
  productCount?: number;
  queryFn: (
    cursor: string | undefined,
    signal: AbortSignal,
  ) => Promise<ProductSectionPage>;
  queryKey: readonly unknown[];
  sectionId: string;
  title: string;
}

interface ProductSectionQuerySnapshot {
  fetchNextPage: () => void;
  hasLoadedFirstPage: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  products: ProductSectionItem[];
}

type VirtualCatalogRow =
  | {
      categoryId?: string;
      key: string;
      sectionId: string;
      sectionKey: string;
      title: string;
      topGap: number;
      type: "heading";
    }
  | {
      categoryId?: string;
      key: string;
      sectionKey: string;
      skeletonCount: number;
      type: "initial-skeleton";
    }
  | {
      categoryId?: string;
      key: string;
      sectionKey: string;
      type: "empty";
    }
  | {
      categoryId?: string;
      items: ProductSectionItem[];
      placeholderCount: number;
      endProductIndex: number;
      key: string;
      sectionKey: string;
      startProductIndex: number;
      type: "products";
    }
  | {
      categoryId?: string;
      isFetchingNextPage: boolean;
      key: string;
      sectionKey: string;
      skeletonCount: number;
      type: "loader";
    };

function areProductSectionQuerySnapshotsEqual(
  firstSnapshot: ProductSectionQuerySnapshot | undefined,
  secondSnapshot: ProductSectionQuerySnapshot,
): boolean {
  return (
    firstSnapshot?.fetchNextPage === secondSnapshot.fetchNextPage &&
    firstSnapshot?.hasLoadedFirstPage === secondSnapshot.hasLoadedFirstPage &&
    firstSnapshot?.hasNextPage === secondSnapshot.hasNextPage &&
    firstSnapshot?.isFetchingNextPage === secondSnapshot.isFetchingNextPage &&
    firstSnapshot?.products === secondSnapshot.products
  );
}

interface ProductSectionDataControllerProps {
  enabled: boolean;
  onSnapshot: (
    sectionKey: string,
    snapshot: ProductSectionQuerySnapshot | null,
  ) => void;
  section: VirtualProductSectionDefinition;
}

const ProductSectionDataController: React.FC<
  ProductSectionDataControllerProps
> = ({ enabled, onSnapshot, section }) => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: section.queryKey,
      queryFn: ({ pageParam, signal }) =>
        section.queryFn(pageParam as string | undefined, signal),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage: ProductSectionPage) =>
        lastPage.nextCursor ?? undefined,
      enabled,
    });
  const products = React.useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const hasLoadedFirstPage = Boolean(data?.pages?.length);
  const handleFetchNextPage = React.useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  React.useEffect(() => {
    onSnapshot(section.key, {
      fetchNextPage: handleFetchNextPage,
      hasLoadedFirstPage,
      hasNextPage: Boolean(hasNextPage),
      isFetchingNextPage,
      products,
    });
  }, [
    handleFetchNextPage,
    hasLoadedFirstPage,
    hasNextPage,
    isFetchingNextPage,
    onSnapshot,
    products,
    section.key,
  ]);

  React.useEffect(() => {
    return () => {
      onSnapshot(section.key, null);
    };
  }, [onSnapshot, section.key]);

  return null;
};

export const VirtualizedCategoryProducts: React.FC<
  VirtualizedCategoryProductsProps
> = ({
  categories,
  className,
  activationBlockedCategoryId = null,
  forceActivatedCategoryId = null,
  ignoreKnownProductCount = false,
}) => {
  const { isDetailed, hasHydrated } = useProductCardViewMode();
  const { isAuthenticated } = useSession();
  const { quantityByProductId, shouldUseCartUi } = useCart();
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [listWidth, setListWidth] = React.useState(0);
  const [scrollMargin, setScrollMargin] = React.useState(0);
  const [scrollPaddingStart, setScrollPaddingStart] = React.useState(0);
  const sections = React.useMemo<VirtualProductSectionDefinition[]>(() => {
    const categorySections = categories.map((category) => ({
      categoryId: category.id,
      key: category.id,
      ...(!ignoreKnownProductCount && typeof category.productCount === "number"
        ? { productCount: Math.max(0, category.productCount) }
        : {}),
      queryKey: [
        "category-products-infinite",
        category.id,
        CATEGORY_PRODUCTS_PAGE_SIZE,
      ] as const,
      queryFn: async (
        cursor: string | undefined,
        signal: AbortSignal,
      ): Promise<ProductSectionPage> => {
        const page = await categoryControllerGetProductCardsByCategory(
          category.id,
          {
            cursor,
            limit: CATEGORY_PRODUCTS_PAGE_SIZE,
          },
          signal,
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
      sectionId: getCategorySectionId(category.id),
      title: category.name,
    }));

    return [
      ...categorySections,
      {
        hideWhenEmpty: true,
        key: UNCATEGORIZED_SECTION_KEY,
        queryKey: getProductControllerGetUncategorizedInfiniteCardsQueryKey(
          UNCATEGORIZED_QUERY_PARAMS,
        ),
        queryFn: async (
          cursor: string | undefined,
          signal: AbortSignal,
        ): Promise<ProductSectionPage> => {
          const page = await productControllerGetUncategorizedInfiniteCards(
            {
              ...UNCATEGORIZED_QUERY_PARAMS,
              cursor,
            },
            signal,
          );

          return {
            nextCursor: page.nextCursor,
            items: page.items.map((product) => ({
              key: product.id,
              product,
            })),
          };
        },
        sectionId: UNCATEGORIZED_PRODUCTS_SECTION_ID,
        title: "Остальное",
      },
    ];
  }, [categories, ignoreKnownProductCount]);
  const sectionKeys = React.useMemo(
    () => sections.map((section) => section.key),
    [sections],
  );
  const sectionKeysKey = sectionKeys.join("|");
  const [activatedSectionKeys, setActivatedSectionKeys] = React.useState<
    Set<string>
  >(() => new Set(sectionKeys[0] ? [sectionKeys[0]] : []));
  const activatedSectionKeysRef = React.useRef(activatedSectionKeys);
  const [querySnapshots, setQuerySnapshots] = React.useState<
    Record<string, ProductSectionQuerySnapshot>
  >({});
  const querySnapshotsRef = React.useRef(querySnapshots);
  const rowVirtualizerRef = React.useRef<Virtualizer<Window, Element> | null>(
    null,
  );
  const categoryAlignmentFrameRef = React.useRef<number | null>(null);
  const categoryStartIndexByIdRef = React.useRef(new Map<string, number>());
  const requestedNextPageSectionKeysRef = React.useRef(new Set<string>());
  const {
    columns,
    gridStyle,
    productRowEstimateSize,
    productRowMinHeight,
    rowGap,
  } = useProductCardVirtualGridLayout({
    isDetailed,
    listWidth,
    quantityByProductId,
    shouldUseCartUi,
  });
  const skeletonCount = isDetailed
    ? DETAILED_INITIAL_SKELETON_ITEMS_COUNT
    : Math.max(GRID_INITIAL_SKELETON_ITEMS_COUNT, columns);

  const activateSectionKeys = React.useCallback((keys: Iterable<string>) => {
    const nextKeysList = Array.from(keys);

    if (
      nextKeysList.length === 0 ||
      nextKeysList.every((key) => activatedSectionKeysRef.current.has(key))
    ) {
      return;
    }

    setActivatedSectionKeys((previousKeys) => {
      let hasChanged = false;
      const nextKeys = new Set(previousKeys);

      for (const key of nextKeysList) {
        if (!nextKeys.has(key)) {
          nextKeys.add(key);
          hasChanged = true;
        }
      }

      return hasChanged ? nextKeys : previousKeys;
    });
  }, []);

  React.useEffect(() => {
    activatedSectionKeysRef.current = activatedSectionKeys;
  }, [activatedSectionKeys]);

  React.useEffect(() => {
    querySnapshotsRef.current = querySnapshots;
  }, [querySnapshots]);

  React.useEffect(() => {
    const validSectionKeys = new Set(sectionKeys);

    setActivatedSectionKeys((previousKeys) => {
      const nextKeys = new Set<string>();

      previousKeys.forEach((key) => {
        if (validSectionKeys.has(key)) {
          nextKeys.add(key);
        }
      });

      if (sectionKeys[0]) {
        nextKeys.add(sectionKeys[0]);
      }

      if (
        nextKeys.size === previousKeys.size &&
        Array.from(nextKeys).every((key) => previousKeys.has(key))
      ) {
        return previousKeys;
      }

      return nextKeys;
    });
  }, [sectionKeys, sectionKeysKey]);

  React.useEffect(() => {
    const categoryId = forceActivatedCategoryId ?? activationBlockedCategoryId;

    if (!categoryId) {
      return;
    }

    activateSectionKeys([categoryId]);
  }, [
    activateSectionKeys,
    activationBlockedCategoryId,
    forceActivatedCategoryId,
  ]);

  const handleSnapshot = React.useCallback(
    (sectionKey: string, snapshot: ProductSectionQuerySnapshot | null) => {
      const currentSnapshot = querySnapshotsRef.current[sectionKey];

      if (!snapshot) {
        if (!currentSnapshot) {
          return;
        }

        setQuerySnapshots((previousSnapshots) => {
          if (!(sectionKey in previousSnapshots)) {
            return previousSnapshots;
          }

          const nextSnapshots = { ...previousSnapshots };
          delete nextSnapshots[sectionKey];
          return nextSnapshots;
        });
        return;
      }

      if (areProductSectionQuerySnapshotsEqual(currentSnapshot, snapshot)) {
        return;
      }

      setQuerySnapshots((previousSnapshots) => {
        return {
          ...previousSnapshots,
          [sectionKey]: snapshot,
        };
      });
    },
    [],
  );

  const { categoryStartIndexById, rows } = React.useMemo(() => {
    const nextRows: VirtualCatalogRow[] = [];
    const nextCategoryStartIndexById = new Map<string, number>();

    sections.forEach((section) => {
      const snapshot = querySnapshots[section.key];
      const products = snapshot?.products ?? [];
      const hasLoadedFirstPage = Boolean(snapshot?.hasLoadedFirstPage);
      const hasKnownProductCount = typeof section.productCount === "number";
      const totalProducts = hasKnownProductCount
        ? Math.max(section.productCount ?? 0, products.length)
        : products.length;
      const isEmpty = hasKnownProductCount
        ? totalProducts === 0
        : hasLoadedFirstPage && products.length === 0;

      if (section.hideWhenEmpty && isEmpty) {
        return;
      }

      if (section.categoryId) {
        nextCategoryStartIndexById.set(section.categoryId, nextRows.length);
      }

      nextRows.push({
        categoryId: section.categoryId,
        key: `${section.key}:heading`,
        sectionId: section.sectionId,
        sectionKey: section.key,
        title: section.title,
        topGap: nextRows.length > 0 ? CATEGORY_SECTION_TOP_GAP_PX : 0,
        type: "heading",
      });

      if (!hasKnownProductCount && !hasLoadedFirstPage) {
        for (let index = 0; index < skeletonCount; index += columns) {
          nextRows.push({
            categoryId: section.categoryId,
            key: `${section.key}:initial-skeleton:${Math.floor(
              index / columns,
            )}`,
            sectionKey: section.key,
            skeletonCount: Math.min(columns, skeletonCount - index),
            type: "initial-skeleton",
          });
        }
        return;
      }

      if (isEmpty) {
        nextRows.push({
          categoryId: section.categoryId,
          key: `${section.key}:empty`,
          sectionKey: section.key,
          type: "empty",
        });
        return;
      }

      const rowSourceCount = hasKnownProductCount
        ? totalProducts
        : products.length;

      for (let index = 0; index < rowSourceCount; index += columns) {
        const endProductIndex = Math.min(index + columns, rowSourceCount);
        const rowItems = products.slice(index, endProductIndex);
        const expectedItemCount = endProductIndex - index;

        nextRows.push({
          categoryId: section.categoryId,
          endProductIndex,
          items: rowItems,
          key: `${section.key}:products:${Math.floor(index / columns)}`,
          placeholderCount: Math.max(0, expectedItemCount - rowItems.length),
          sectionKey: section.key,
          startProductIndex: index,
          type: "products",
        });
      }

      if (
        !hasKnownProductCount &&
        (snapshot?.hasNextPage || snapshot?.isFetchingNextPage)
      ) {
        nextRows.push({
          categoryId: section.categoryId,
          isFetchingNextPage: Boolean(snapshot?.isFetchingNextPage),
          key: `${section.key}:loader`,
          sectionKey: section.key,
          skeletonCount: Math.max(1, columns),
          type: "loader",
        });
      }
    });

    return {
      categoryStartIndexById: nextCategoryStartIndexById,
      rows: nextRows,
    };
  }, [columns, querySnapshots, sections, skeletonCount]);

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

  const cancelPendingCategoryAlignment = React.useCallback(() => {
    if (categoryAlignmentFrameRef.current !== null) {
      window.cancelAnimationFrame(categoryAlignmentFrameRef.current);
      categoryAlignmentFrameRef.current = null;
    }
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
        return getCategoryHeadingRowEstimate(row.title, listWidth) + row.topGap;
      }

      if (row.type === "empty") {
        return EMPTY_CATEGORY_ROW_HEIGHT_PX;
      }

      if (row.type === "loader" && !row.isFetchingNextPage) {
        return 1;
      }

      return productRowEstimateSize;
    },
    [listWidth, productRowEstimateSize, rows],
  );
  const getVirtualRowKey = React.useCallback(
    (index: number) => rows[index]?.key ?? `virtual-row-${index}`,
    [rows],
  );
  const rowVirtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: estimateRowSize,
    overscan: VIRTUAL_CATEGORY_PRODUCTS_OVERSCAN,
    scrollMargin,
    scrollPaddingStart,
    scrollToFn: scrollWindowWithStableProductCardMeasurements,
    paddingEnd: 0,
    gap: rowGap,
    enabled: rows.length > 0,
    getItemKey: getVirtualRowKey,
    useAnimationFrameWithResizeObserver: true,
    useFlushSync: false,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();

  React.useLayoutEffect(() => {
    rowVirtualizerRef.current = rowVirtualizer;
    categoryStartIndexByIdRef.current = categoryStartIndexById;
  }, [categoryStartIndexById, rowVirtualizer]);

  React.useEffect(() => {
    Object.entries(querySnapshots).forEach(([sectionKey, snapshot]) => {
      if (!snapshot.isFetchingNextPage) {
        requestedNextPageSectionKeysRef.current.delete(sectionKey);
      }
    });
  }, [querySnapshots]);

  React.useEffect(() => {
    rowVirtualizer.measure();
  }, [
    columns,
    isDetailed,
    listWidth,
    productRowEstimateSize,
    rowVirtualizer,
  ]);

  const alignMountedCategoryHeading = React.useCallback(
    (categoryId: string, behavior: ScrollBehavior = "instant") => {
      if (typeof window === "undefined") {
        return false;
      }

      const heading = document.getElementById(getCategorySectionId(categoryId));

      if (!heading) {
        return false;
      }

      const targetOffset = Math.max(
        0,
        window.scrollY +
          heading.getBoundingClientRect().top -
          getCategorySectionScrollTargetOffset(),
      );

      if (Math.abs(window.scrollY - targetOffset) > 1) {
        window.scrollTo({
          top: targetOffset,
          behavior,
        });
      }

      return true;
    },
    [],
  );

  const alignCategoryHeadingAfterVirtualScroll = React.useCallback(
    (categoryId: string, behavior: ScrollBehavior) => {
      if (typeof window === "undefined") {
        return;
      }

      cancelPendingCategoryAlignment();

      let frameCount = 0;
      const alignOnNextFrame = () => {
        categoryAlignmentFrameRef.current = null;
        frameCount += 1;
        alignMountedCategoryHeading(
          categoryId,
          frameCount === 1 ? behavior : "instant",
        );

        if (frameCount >= CATEGORY_SCROLL_ALIGNMENT_FRAME_COUNT) {
          return;
        }

        categoryAlignmentFrameRef.current =
          window.requestAnimationFrame(alignOnNextFrame);
      };

      categoryAlignmentFrameRef.current =
        window.requestAnimationFrame(alignOnNextFrame);
    },
    [alignMountedCategoryHeading, cancelPendingCategoryAlignment],
  );

  React.useEffect(() => {
    return () => {
      cancelPendingCategoryAlignment();
    };
  }, [cancelPendingCategoryAlignment]);

  React.useEffect(() => {
    return registerCategorySectionScroller((categoryId, options) => {
      const virtualizer = rowVirtualizerRef.current;
      const rowIndex = categoryStartIndexByIdRef.current.get(categoryId);

      if (
        !virtualizer ||
        typeof rowIndex !== "number" ||
        typeof window === "undefined"
      ) {
        return false;
      }

      activateSectionKeys([categoryId]);
      measureList();
      virtualizer.measure();
      const behavior = options?.behavior ?? "instant";

      virtualizer.scrollToIndex(rowIndex, {
        align: "start",
        behavior,
      });

      alignCategoryHeadingAfterVirtualScroll(categoryId, behavior);

      return true;
    });
  }, [
    activateSectionKeys,
    alignCategoryHeadingAfterVirtualScroll,
    measureList,
  ]);

  React.useEffect(() => {
    if (activationBlockedCategoryId) {
      activateSectionKeys([activationBlockedCategoryId]);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const activationTop = window.scrollY + scrollPaddingStart;
    const activationBottom =
      window.scrollY + window.innerHeight + productRowEstimateSize * 2;
    const nextKeys = new Set<string>();

    virtualRows.forEach((virtualRow) => {
      if (
        virtualRow.end < activationTop ||
        virtualRow.start > activationBottom
      ) {
        return;
      }

      const row = rows[virtualRow.index];

      if (row) {
        nextKeys.add(row.sectionKey);
      }
    });

    if (nextKeys.size > 0) {
      activateSectionKeys(nextKeys);
    }
  }, [
    activateSectionKeys,
    activationBlockedCategoryId,
    productRowEstimateSize,
    rows,
    scrollPaddingStart,
    virtualRows,
  ]);

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

      if (!row || (row.type !== "loader" && row.type !== "products")) {
        return;
      }

      const snapshot = querySnapshots[row.sectionKey];
      const loadedProductCount = snapshot?.products.length ?? 0;
      const shouldFetchNextPage =
        row.type === "loader"
          ? true
          : row.placeholderCount > 0 ||
            row.endProductIndex >= loadedProductCount - columns;

      if (
        shouldFetchNextPage &&
        snapshot?.hasNextPage &&
        !snapshot.isFetchingNextPage &&
        !requestedNextPageSectionKeysRef.current.has(row.sectionKey)
      ) {
        requestedNextPageSectionKeysRef.current.add(row.sectionKey);
        snapshot.fetchNextPage();
      }
    });
  }, [
    columns,
    productRowEstimateSize,
    querySnapshots,
    rows,
    scrollPaddingStart,
    virtualRows,
  ]);

  return (
    <>
      {sections.map((section) => (
        <ProductSectionDataController
          key={section.key}
          enabled={
            activatedSectionKeys.has(section.key) && section.productCount !== 0
          }
          section={section}
          onSnapshot={handleSnapshot}
        />
      ))}
      <div
        ref={listRef}
        className={cn("relative w-full", className)}
        style={{ overflowAnchor: "none" }}
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
                data-catalog-category-id={row.categoryId}
                ref={rowVirtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${
                    virtualRow.start - rowVirtualizer.options.scrollMargin
                  }px)`,
                }}
              >
                {row.type === "heading" ? (
                  <CategorySectionHeading
                    height={
                      getCategoryHeadingRowEstimate(row.title, listWidth) +
                      row.topGap
                    }
                    id={row.sectionId}
                    topGap={row.topGap}
                    title={row.title}
                  />
                ) : row.type === "initial-skeleton" ? (
                  hasHydrated ? (
                    <div
                      className="grid items-stretch"
                      style={{
                        ...gridStyle,
                        height: productRowEstimateSize,
                      }}
                    >
                      {Array.from({ length: row.skeletonCount }, (_, index) => (
                        <ProductCardSkeleton
                          key={`${row.sectionKey}-initial-${index}`}
                          isDetailed={isDetailed}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      aria-hidden
                      style={{ height: productRowEstimateSize }}
                    />
                  )
                ) : row.type === "empty" ? (
                  <div
                    className="text-muted-foreground flex items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm"
                    style={{ height: EMPTY_CATEGORY_ROW_HEIGHT_PX }}
                  >
                    В этой категории пока нет товаров
                  </div>
                ) : row.type === "products" ? (
                  <div
                    className="grid items-stretch"
                    style={{
                      ...gridStyle,
                      minHeight: productRowMinHeight,
                    }}
                  >
                    {row.items.map((item, itemIndex) => (
                      <ProductSectionCard
                        key={`${row.sectionKey}:${item.categoryPosition ?? "na"}:${item.key ?? item.product.id}:${itemIndex}`}
                        item={item}
                        isDetailed={isDetailed}
                        shouldUseCartUi={shouldUseCartUi}
                        isAuthenticated={isAuthenticated}
                      />
                    ))}
                    {Array.from(
                      { length: row.placeholderCount },
                      (_, index) => (
                        <ProductCardSkeleton
                          key={`${row.sectionKey}:placeholder:${
                            row.startProductIndex + row.items.length + index
                          }`}
                          isDetailed={isDetailed}
                        />
                      ),
                    )}
                  </div>
                ) : row.isFetchingNextPage ? (
                  <div
                    className="grid items-stretch"
                    style={{
                      ...gridStyle,
                      height: productRowEstimateSize,
                    }}
                  >
                    {Array.from({ length: row.skeletonCount }, (_, index) => (
                      <ProductCardSkeleton
                        key={`${row.sectionKey}-next-${index}`}
                        isDetailed={isDetailed}
                      />
                    ))}
                  </div>
                ) : (
                  <div aria-hidden className="h-px w-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
