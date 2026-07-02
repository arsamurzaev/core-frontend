"use client";

import { ProductCardRuntime } from "@/core/catalog-runtime/ui";
import {
  CATEGORY_SECTION_SCROLL_MARGIN_TOP,
  getCategorySectionId,
  getCategorySectionScrollOffset,
  scrollCategorySectionIntoView,
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
  PRODUCT_CARD_GRID_BASE_HEIGHT_PX,
  PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME,
  PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME,
  ProductLink,
  ToggleProductPopularAction,
  useProductCardViewMode,
} from "@/core/modules/product";
import { EditProductCardAction } from "@/core/widgets/edit-product-drawer/ui/edit-product-card-action";
import {
  CategoryDto,
  ProductWithAttributesDtoStatus,
  ProductWithAttributesDto,
  categoryControllerGetProductCardsByCategory,
  getProductControllerGetUncategorizedInfiniteCardsQueryKey,
  productControllerGetUncategorizedInfiniteCards,
} from "@/shared/api/generated/react-query";
import {
  canManageCatalogContent,
  isChildCatalog,
} from "@/shared/lib/catalog-content-access";
import { cn } from "@/shared/lib/utils";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { useSession } from "@/shared/providers/session-provider";
import { useInfiniteQuery } from "@tanstack/react-query";
import React from "react";

interface CategoryProductsProps {
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

interface ProductSectionDefinition {
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

interface ProductSectionCardProps {
  item: ProductSectionItem;
  isDetailed: boolean;
  imageLoading: React.ImgHTMLAttributes<HTMLImageElement>["loading"];
  shouldUseCartUi: boolean;
  isAuthenticated: boolean;
  canManageContent: boolean;
  showParentCatalogHiddenStatus: boolean;
}

interface ProductSectionProps {
  activeJumpCategoryId: string | null;
  blockViewportAutoLoad: boolean;
  canManageContent: boolean;
  enableDomBudget: boolean;
  forceLoad: boolean;
  index: number;
  isAuthenticated: boolean;
  isDetailed: boolean;
  section: ProductSectionDefinition;
  shouldUseCartUi: boolean;
  showParentCatalogHiddenStatus: boolean;
}

export const CATEGORY_PRODUCTS_PAGE_SIZE = 32;
export const UNCATEGORIZED_PRODUCTS_SECTION_ID =
  "uncategorized-products-section";
const UNCATEGORIZED_SECTION_KEY = "__uncategorized__";
const GRID_INITIAL_SKELETON_ITEMS_COUNT = 4;
const DETAILED_INITIAL_SKELETON_ITEMS_COUNT = 2;
const GRID_NEXT_PAGE_SKELETON_ITEMS_COUNT = 4;
const DETAILED_NEXT_PAGE_SKELETON_ITEMS_COUNT = 1;
const MAX_CATEGORY_SKELETON_ITEMS_COUNT = 16;
const PRODUCT_CARD_GRID_GAP_PX = 12;
const PRODUCT_CARD_DETAILED_GAP_PX = 16;
const PRODUCT_CARD_DETAILED_SKELETON_HEIGHT_PX = 160;
const ESTIMATED_GRID_SKELETON_COLUMNS = 3;
const SECTION_INTERSECTION_BOTTOM_MARGIN_PX = 900;
const NEXT_PAGE_INTERSECTION_BOTTOM_MARGIN_PX = 360;
const CATEGORY_INTERSECTION_TOP_GUARD_PX = 32;
const LARGE_CATALOG_CATEGORY_COUNT = 20;
const LARGE_CATALOG_PRODUCT_COUNT = 300;
const UNCATEGORIZED_QUERY_PARAMS = {
  limit: String(CATEGORY_PRODUCTS_PAGE_SIZE),
};

function getCategoryProductCount(category: CategoryDto): number | undefined {
  const maybeLegacyCount = (category as { count?: unknown }).count;
  const productCount =
    typeof category.productCount === "number"
      ? category.productCount
      : typeof maybeLegacyCount === "number"
        ? maybeLegacyCount
        : undefined;

  if (typeof productCount !== "number" || !Number.isFinite(productCount)) {
    return undefined;
  }

  return Math.max(0, Math.floor(productCount));
}

function clampCategorySkeletonCount(count: number): number {
  return Math.min(
    MAX_CATEGORY_SKELETON_ITEMS_COUNT,
    Math.max(0, Math.floor(count)),
  );
}

function getSkeletonListEstimatedHeight(
  count: number,
  isDetailed: boolean,
): number {
  if (count <= 0) return 0;

  if (isDetailed) {
    return (
      count * PRODUCT_CARD_DETAILED_SKELETON_HEIGHT_PX +
      Math.max(0, count - 1) * PRODUCT_CARD_DETAILED_GAP_PX
    );
  }

  const rows = Math.ceil(count / ESTIMATED_GRID_SKELETON_COLUMNS);
  return (
    rows * PRODUCT_CARD_GRID_BASE_HEIGHT_PX +
    Math.max(0, rows - 1) * PRODUCT_CARD_GRID_GAP_PX
  );
}

function getCategoryProductsIntersectionRootMargin(
  bottomMarginPx: number,
): string {
  if (typeof window === "undefined") {
    return `0px 0px ${bottomMarginPx}px 0px`;
  }

  const topOffset =
    Math.ceil(getCategorySectionScrollOffset()) +
    CATEGORY_INTERSECTION_TOP_GUARD_PX;

  return `-${topOffset}px 0px ${bottomMarginPx}px 0px`;
}

function useIntersectionFlag({
  enabled = true,
  rootMargin,
}: {
  enabled?: boolean;
  rootMargin?: string;
}) {
  const [element, setElement] = React.useState<HTMLElement | null>(null);
  const [hasIntersected, setHasIntersected] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) {
      setHasIntersected(false);
      return;
    }

    if (hasIntersected) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setHasIntersected(true);
      return;
    }

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setHasIntersected(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, enabled, hasIntersected, rootMargin]);

  return [setElement, hasIntersected] as const;
}

function useIntersectionCallback({
  enabled,
  onIntersect,
  rootMargin,
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

const ProductSectionCard = React.memo(
  ({
    item,
    isDetailed,
    imageLoading,
    shouldUseCartUi,
    isAuthenticated,
    canManageContent,
    showParentCatalogHiddenStatus,
  }: ProductSectionCardProps) => {
    const { product, categoryId, categoryPosition } = item;
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
              categoryId={categoryId}
              categoryPosition={categoryPosition}
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
          shouldRenderCartUi ? (
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

function ProductSectionSkeletons({
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

const ProductSection: React.FC<ProductSectionProps> = ({
  activeJumpCategoryId,
  blockViewportAutoLoad,
  canManageContent,
  enableDomBudget,
  forceLoad,
  index,
  isAuthenticated,
  isDetailed,
  section,
  shouldUseCartUi,
  showParentCatalogHiddenStatus,
}) => {
  const hasKnownProductCount = typeof section.productCount === "number";
  const knownProductCount = Math.max(0, section.productCount ?? 0);
  const isKnownEmpty = hasKnownProductCount && knownProductCount === 0;
  const sectionIntersectionRootMargin =
    getCategoryProductsIntersectionRootMargin(
      SECTION_INTERSECTION_BOTTOM_MARGIN_PX,
    );
  const nextPageIntersectionRootMargin =
    getCategoryProductsIntersectionRootMargin(
      NEXT_PAGE_INTERSECTION_BOTTOM_MARGIN_PX,
    );
  const [setSectionElement, hasEnteredViewport] = useIntersectionFlag({
    enabled: !isKnownEmpty && !blockViewportAutoLoad,
    rootMargin: sectionIntersectionRootMargin,
  });
  const shouldQuery =
    !isKnownEmpty &&
    (forceLoad ||
      (!blockViewportAutoLoad && (index === 0 || hasEnteredViewport)));
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: section.queryKey,
      queryFn: ({ pageParam, signal }) =>
        section.queryFn(pageParam as string | undefined, signal),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage: ProductSectionPage) =>
        lastPage.nextCursor ?? undefined,
      enabled: shouldQuery,
    });
  const productPages = React.useMemo(
    () => data?.pages.map((page) => page.items) ?? [],
    [data],
  );
  const loadedProductCount = React.useMemo(
    () => productPages.reduce((sum, pageItems) => sum + pageItems.length, 0),
    [productPages],
  );
  const previousLoadedProductCountRef = React.useRef(loadedProductCount);
  const hasLoadedFirstPage = Boolean(data?.pages?.length);
  const isLoadedEmpty = hasLoadedFirstPage && loadedProductCount === 0;
  const isHiddenEmpty =
    Boolean(section.hideWhenEmpty) && (isKnownEmpty || isLoadedEmpty);
  const listClassName = isDetailed
    ? PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME
    : PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME;
  const fallbackInitialSkeletonCount = isDetailed
    ? DETAILED_INITIAL_SKELETON_ITEMS_COUNT
    : GRID_INITIAL_SKELETON_ITEMS_COUNT;
  const fallbackNextPageSkeletonCount = isDetailed
    ? DETAILED_NEXT_PAGE_SKELETON_ITEMS_COUNT
    : GRID_NEXT_PAGE_SKELETON_ITEMS_COUNT;
  const initialSkeletonCount = hasKnownProductCount
    ? clampCategorySkeletonCount(knownProductCount)
    : fallbackInitialSkeletonCount;
  const initialSkeletonEstimatedHeight = getSkeletonListEstimatedHeight(
    initialSkeletonCount,
    isDetailed,
  );
  const nextPageSkeletonCount = hasKnownProductCount
    ? clampCategorySkeletonCount(knownProductCount - loadedProductCount)
    : fallbackNextPageSkeletonCount;
  const blockViewportAutoLoadRef = React.useRef(blockViewportAutoLoad);
  React.useLayoutEffect(() => {
    blockViewportAutoLoadRef.current = blockViewportAutoLoad;
  }, [blockViewportAutoLoad]);
  const handleLoadNextPage = React.useCallback(() => {
    if (blockViewportAutoLoadRef.current) {
      return;
    }

    void fetchNextPage();
  }, [fetchNextPage]);
  const canLoadNextPage =
    !blockViewportAutoLoad &&
    hasLoadedFirstPage &&
    (index === 0 || hasEnteredViewport);
  const setNextPageElement = useIntersectionCallback({
    enabled: Boolean(canLoadNextPage && hasNextPage && !isFetchingNextPage),
    onIntersect: handleLoadNextPage,
    rootMargin: nextPageIntersectionRootMargin,
  });
  const getSectionImageLoading = React.useCallback(
    (pageIndex: number, itemIndex: number) => {
      const eagerItemCount = isDetailed
        ? DETAILED_INITIAL_SKELETON_ITEMS_COUNT
        : GRID_INITIAL_SKELETON_ITEMS_COUNT;

      return index === 0 && pageIndex === 0 && itemIndex < eagerItemCount
        ? ("eager" as const)
        : ("lazy" as const);
    },
    [index, isDetailed],
  );

  React.useLayoutEffect(() => {
    const previousLoadedProductCount = previousLoadedProductCountRef.current;
    previousLoadedProductCountRef.current = loadedProductCount;

    if (
      !activeJumpCategoryId ||
      previousLoadedProductCount === loadedProductCount
    ) {
      return;
    }

    scrollCategorySectionIntoView(activeJumpCategoryId, {
      behavior: "instant",
    });
  }, [activeJumpCategoryId, loadedProductCount]);

  if (isHiddenEmpty) {
    return null;
  }

  if (section.hideWhenEmpty && !hasLoadedFirstPage && !shouldQuery) {
    return <div ref={setSectionElement} aria-hidden className="h-px w-full" />;
  }

  return (
    <section
      ref={setSectionElement}
      data-catalog-category-id={section.categoryId}
      className="space-y-4"
    >
      <h2
        id={section.sectionId}
        className="px-1 text-left"
        style={{ scrollMarginTop: CATEGORY_SECTION_SCROLL_MARGIN_TOP }}
      >
        <span className="line-clamp-2 text-lg leading-tight font-bold text-text-primary [overflow-wrap:anywhere] sm:text-xl">
          {section.title}
        </span>
      </h2>

      <div className="space-y-3">
        {isKnownEmpty ? (
          <div className="flex min-h-40 items-center justify-center rounded-panel border border-dashed border-line-subtle px-4 text-center text-sm text-text-muted">
            В этой категории пока нет товаров
          </div>
        ) : loadedProductCount > 0 ? (
          productPages.map((pageItems, pageIndex) => (
            <ProductDomBudgetContent
              key={`${section.key}:page:${pageIndex}`}
              className={listClassName}
              enabled={enableDomBudget}
              forceRender={forceLoad}
            >
              {pageItems.map((item, itemIndex) => (
                <ProductSectionCard
                  key={`${section.key}:${item.categoryPosition ?? "na"}:${
                    item.key ?? item.product.id
                  }:${pageIndex}:${itemIndex}`}
                  item={item}
                  isDetailed={isDetailed}
                  imageLoading={getSectionImageLoading(pageIndex, itemIndex)}
                  shouldUseCartUi={shouldUseCartUi}
                  isAuthenticated={isAuthenticated}
                  canManageContent={canManageContent}
                  showParentCatalogHiddenStatus={
                    showParentCatalogHiddenStatus
                  }
                />
              ))}
            </ProductDomBudgetContent>
          ))
        ) : !hasLoadedFirstPage ? (
          <ProductDomBudgetContent
            className={listClassName}
            enabled={enableDomBudget && index > 0}
            estimatedHeight={initialSkeletonEstimatedHeight}
            forceRender={forceLoad}
          >
            <ProductSectionSkeletons
              count={initialSkeletonCount}
              isDetailed={isDetailed}
            />
          </ProductDomBudgetContent>
        ) : (
          <div className="flex min-h-40 items-center justify-center rounded-panel border border-dashed border-line-subtle px-4 text-center text-sm text-text-muted">
            В этой категории пока нет товаров
          </div>
        )}

        {isFetchingNextPage && nextPageSkeletonCount > 0 ? (
          <div className={listClassName}>
            <ProductSectionSkeletons
              count={nextPageSkeletonCount}
              isDetailed={isDetailed}
            />
          </div>
        ) : null}

        {hasNextPage ? (
          <div ref={setNextPageElement} aria-hidden className="h-px w-full" />
        ) : null}
      </div>
    </section>
  );
};

export const CategoryProducts: React.FC<CategoryProductsProps> = ({
  categories,
  className,
  activationBlockedCategoryId = null,
  forceActivatedCategoryId = null,
}) => {
  const { isDetailed } = useProductCardViewMode();
  const { isAuthenticated } = useSession();
  const { catalog } = useCatalogState();
  const { shouldUseCartUi } = useCart();
  const canManageContent = canManageCatalogContent(catalog);
  const showParentCatalogHiddenStatus =
    isAuthenticated && isChildCatalog(catalog);
  const forceLoadedCategoryId =
    forceActivatedCategoryId ?? activationBlockedCategoryId;
  const knownProductCount = React.useMemo(
    () =>
      categories.reduce(
        (sum, category) => sum + (getCategoryProductCount(category) ?? 0),
        0,
      ),
    [categories],
  );
  const hasUnknownProductCounts = React.useMemo(
    () =>
      categories.some(
        (category) => getCategoryProductCount(category) === undefined,
      ),
    [categories],
  );
  const enableDomBudget =
    categories.length >= LARGE_CATALOG_CATEGORY_COUNT ||
    knownProductCount >= LARGE_CATALOG_PRODUCT_COUNT ||
    hasUnknownProductCounts;
  const blockViewportAutoLoad = Boolean(forceLoadedCategoryId);
  const sections = React.useMemo<ProductSectionDefinition[]>(() => {
    const categorySections = categories.map((category) => {
      const productCount = getCategoryProductCount(category);

      return {
        categoryId: category.id,
        key: category.id,
        ...(typeof productCount === "number" ? { productCount } : {}),
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
      };
    });

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

  return (
    <div className={cn("space-y-7.5", className)}>
      {sections.map((section, index) => (
        <ProductSection
          key={section.key}
          activeJumpCategoryId={forceLoadedCategoryId}
          blockViewportAutoLoad={blockViewportAutoLoad}
          canManageContent={canManageContent}
          showParentCatalogHiddenStatus={showParentCatalogHiddenStatus}
          enableDomBudget={enableDomBudget}
          forceLoad={
            Boolean(section.categoryId) &&
            section.categoryId === forceLoadedCategoryId
          }
          index={index}
          isAuthenticated={isAuthenticated}
          isDetailed={isDetailed}
          section={section}
          shouldUseCartUi={shouldUseCartUi}
        />
      ))}
    </div>
  );
};
