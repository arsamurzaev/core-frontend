"use client";

import { ProductCardRuntime } from "@/core/catalog-runtime/ui";
import {
  CATEGORY_SECTION_SCROLL_MARGIN_TOP,
  getCategorySectionId,
  getCategorySectionScrollOffset,
  getCategorySectionScrollTargetOffset,
  registerCategorySectionScroller,
} from "@/core/modules/browser/model/category-scroll";
import { useCart } from "@/core/modules/cart/model/cart-context";
import { CartProductAction } from "@/core/modules/cart/ui/cart-product-action";
import { CartProductCardFooterAction } from "@/core/modules/cart/ui/cart-product-card-footer-action";
import { ToggleProductPopularAction } from "@/core/modules/product/actions/ui";
import { ProductCardSkeleton } from "@/core/modules/product/entities/product-card-skeleton";
import { ProductLink } from "@/core/modules/product/entities/product-link";
import { isMoySkladProduct } from "@/core/modules/product/model/moysklad-product";
import { useProductCardViewMode } from "@/core/modules/product/model/use-product-card-view-mode";
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
const PRODUCT_CARD_GRID_MIN_WIDTH_PX = 127;
const PRODUCT_CARD_GAP_PX = 16;
const GRID_VIRTUAL_ROW_ESTIMATE_FALLBACK_PX = 380;
const GRID_VIRTUAL_ROW_MAX_ESTIMATE_PX = 390;
const GRID_VIRTUAL_ROW_MIN_ESTIMATE_PX = 340;
const GRID_VIRTUAL_ROW_TEXT_ESTIMATE_PX = 124;
const DETAILED_VIRTUAL_ROW_ESTIMATE_PX = 220;
const CATEGORY_HEADING_ROW_ESTIMATE_PX = 40;
const EMPTY_CATEGORY_ROW_HEIGHT_PX = 160;
const VIRTUAL_CATEGORY_PRODUCTS_OVERSCAN = 2;
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
            isDetailed={isDetailed}
            isMoySkladLinked={
              !shouldUseCartUi && isAuthenticated && isMoySkladProduct(product)
            }
            actions={
              !shouldUseCartUi && isDetailed ? (
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
            pluginContainerClassName="h-full"
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
        {shouldUseCartUi ? <CartProductAction product={product} /> : null}
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
    );
  },
);
ProductSectionCard.displayName = "ProductSectionCard";

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
      type: "heading";
    }
  | {
      categoryId?: string;
      key: string;
      sectionKey: string;
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
}) => {
  const { isDetailed, hasHydrated } = useProductCardViewMode();
  const { isAuthenticated } = useSession();
  const { shouldUseCartUi } = useCart();
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [listWidth, setListWidth] = React.useState(0);
  const [scrollMargin, setScrollMargin] = React.useState(0);
  const [scrollPaddingStart, setScrollPaddingStart] = React.useState(0);
  const sections = React.useMemo<VirtualProductSectionDefinition[]>(() => {
    const categorySections = categories.map((category) => ({
      categoryId: category.id,
      key: category.id,
      ...(typeof category.productCount === "number"
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
  }, [categories]);
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
  const categoryStartIndexByIdRef = React.useRef(new Map<string, number>());
  const requestedNextPageSectionKeysRef = React.useRef(new Set<string>());
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
        type: "heading",
      });

      if (!hasKnownProductCount && !hasLoadedFirstPage) {
        nextRows.push({
          categoryId: section.categoryId,
          key: `${section.key}:initial-skeleton`,
          sectionKey: section.key,
          type: "initial-skeleton",
        });
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
          type: "loader",
        });
      }
    });

    return {
      categoryStartIndexById: nextCategoryStartIndexById,
      rows: nextRows,
    };
  }, [columns, querySnapshots, sections]);

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
        return CATEGORY_HEADING_ROW_ESTIMATE_PX;
      }

      if (row.type === "empty") {
        return EMPTY_CATEGORY_ROW_HEIGHT_PX;
      }

      if (row.type === "loader" && !row.isFetchingNextPage) {
        return 1;
      }

      return productRowEstimateSize;
    },
    [productRowEstimateSize, rows],
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
    paddingEnd: 0,
    gap: PRODUCT_CARD_GAP_PX,
    enabled: rows.length > 0,
    getItemKey: getVirtualRowKey,
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
  }, [columns, isDetailed, rowVirtualizer, rows.length]);

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

      window.requestAnimationFrame(() => {
        if (alignMountedCategoryHeading(categoryId, behavior)) {
          return;
        }

        window.requestAnimationFrame(() => {
          alignMountedCategoryHeading(categoryId, behavior);
        });
      });
    },
    [alignMountedCategoryHeading],
  );

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

  const gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;

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
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${
                    virtualRow.start - rowVirtualizer.options.scrollMargin
                  }px)`,
                }}
              >
                {row.type === "heading" ? (
                  <h2
                    id={row.sectionId}
                    className="px-1 pt-1 pb-3 text-left text-xl font-bold"
                    style={{
                      scrollMarginTop: CATEGORY_SECTION_SCROLL_MARGIN_TOP,
                    }}
                  >
                    {row.title}
                  </h2>
                ) : row.type === "initial-skeleton" ? (
                  hasHydrated ? (
                    <div
                      className="grid gap-4"
                      style={{
                        gridTemplateColumns,
                        height: productRowEstimateSize,
                      }}
                    >
                      {Array.from({ length: skeletonCount }, (_, index) => (
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
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns,
                      height: productRowEstimateSize,
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
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns,
                      height: productRowEstimateSize,
                    }}
                  >
                    {Array.from({ length: skeletonCount }, (_, index) => (
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
