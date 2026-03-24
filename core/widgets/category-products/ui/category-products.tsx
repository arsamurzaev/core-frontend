"use client";

import {
  PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME,
  PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME,
  useProductCardViewMode,
} from "@/core/modules/product/model/use-product-card-view-mode";
import { isMoySkladProduct } from "@/core/modules/product/model/moysklad-product";
import { ProductCard } from "@/core/modules/product/entities/product-card";
import { ProductCardSkeleton } from "@/core/modules/product/entities/product-card-skeleton";
import { ProductLink } from "@/core/modules/product/entities/product-link";
import { EditProductCardAction } from "@/core/widgets/edit-product-drawer/ui/edit-product-card-action";
import { ToggleProductPopularAction } from "@/core/modules/product/actions/ui/toggle-product-popular-action";
import {
  CategoryDto,
  ProductWithAttributesDto,
  categoryControllerGetProductsByCategory,
  getProductControllerGetUncategorizedInfiniteQueryKey,
  productControllerGetUncategorizedInfinite,
} from "@/shared/api/generated";
import { cn } from "@/shared/lib/utils";
import { useSession } from "@/shared/providers/session-provider";
import { useInfiniteQuery } from "@tanstack/react-query";
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

export const CATEGORY_PRODUCTS_PAGE_SIZE = 16;
export const UNCATEGORIZED_PRODUCTS_SECTION_ID = "uncategorized-products-section";
const GRID_INITIAL_SKELETON_ITEMS_COUNT = CATEGORY_PRODUCTS_PAGE_SIZE;
const DETAILED_INITIAL_SKELETON_ITEMS_COUNT = 6;
const GRID_NEXT_PAGE_SKELETON_ITEMS_COUNT = 4;
const DETAILED_NEXT_PAGE_SKELETON_ITEMS_COUNT = 3;

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
  const { isDetailed } = useProductCardViewMode();
  const { isAuthenticated } = useSession();
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const [isActivated, setIsActivated] = React.useState(initiallyActivated);

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

  const hasLoadedFirstPage = React.useMemo(
    () => Boolean(data?.pages?.length),
    [data],
  );
  const products = React.useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const listClassName = React.useMemo(
    () =>
      isDetailed
        ? PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME
        : PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME,
    [isDetailed],
  );
  const initialSkeletonKeys = React.useMemo(
    () =>
      Array.from(
        {
          length: isDetailed
            ? DETAILED_INITIAL_SKELETON_ITEMS_COUNT
            : GRID_INITIAL_SKELETON_ITEMS_COUNT,
        },
        (_, index) => index,
      ),
    [isDetailed],
  );
  const nextPageSkeletonKeys = React.useMemo(
    () =>
      Array.from(
        {
          length: isDetailed
            ? DETAILED_NEXT_PAGE_SKELETON_ITEMS_COUNT
            : GRID_NEXT_PAGE_SKELETON_ITEMS_COUNT,
        },
        (_, index) => index,
      ),
    [isDetailed],
  );

  React.useEffect(() => {
    if (!allowLoadMore || !isActivated || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const target = loadMoreRef.current;

    if (!target || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void fetchNextPage();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [
    allowLoadMore,
    fetchNextPage,
    hasNextPage,
    isActivated,
    isFetchingNextPage,
  ]);

  if (hideWhenEmpty && hasLoadedFirstPage && products.length === 0) {
    return null;
  }

  return (
    <div id={sectionId} className={cn("space-y-7.5 min-h-90", className)}>
      <h2 ref={headingRef} className="pl-1 text-left text-xl font-bold">
        {title}
      </h2>
      <div style={{ overflowAnchor: "none" }}>
        {!hasLoadedFirstPage ? (
          <ul className={listClassName}>
            {initialSkeletonKeys.map((index) => (
              <ProductCardSkeleton
                key={`initial-skeleton-${index}`}
                isDetailed={isDetailed}
              />
            ))}
          </ul>
        ) : (
          <ul className={listClassName}>
            {products.map(({ key, product, categoryId, categoryPosition }) => (
              <article key={key} className="relative">
                <ProductLink slug={product.slug} className="block h-full">
                  <ProductCard
                    data={product}
                    isDetailed={isDetailed}
                    className={cn("h-full", isDetailed && "min-h-[160px]")}
                    isVisiblePrice={isAuthenticated}
                    footerAction={
                      isAuthenticated ? (
                        <ToggleProductPopularAction
                          productId={product.id}
                          isPopular={Boolean(product.isPopular)}
                        />
                      ) : undefined
                    }
                  />
                </ProductLink>
                <EditProductCardAction
                  categoryId={categoryId}
                  categoryPosition={categoryPosition}
                  isMoySkladLinked={isMoySkladProduct(product)}
                  productId={product.id}
                  status={product.status}
                />
              </article>
            ))}
            {isFetchingNextPage &&
              nextPageSkeletonKeys.map((index) => (
                <ProductCardSkeleton
                  key={`next-page-${index}`}
                  isDetailed={isDetailed}
                />
              ))}
          </ul>
        )}
      </div>
      <div ref={loadMoreRef} aria-hidden className="h-px w-full" />
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
      ["category-products-infinite", category.id, CATEGORY_PRODUCTS_PAGE_SIZE] as const,
    [category.id],
  );

  const queryFn = React.useCallback(
    async (cursor: string | undefined): Promise<ProductSectionPage> => {
      const page = await categoryControllerGetProductsByCategory(category.id, {
        cursor,
        limit: CATEGORY_PRODUCTS_PAGE_SIZE,
      });

      return {
        nextCursor: page.nextCursor,
        items: page.items.map(({ productId, product, position }) => ({
          categoryId: category.id,
          categoryPosition: position,
          key: productId,
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
  const queryParams = React.useMemo(
    () => ({
      limit: String(CATEGORY_PRODUCTS_PAGE_SIZE),
    }),
    [],
  );

  const queryKey = React.useMemo(
    () => getProductControllerGetUncategorizedInfiniteQueryKey(queryParams),
    [queryParams],
  );

  const queryFn = React.useCallback(
    async (cursor: string | undefined): Promise<ProductSectionPage> => {
      const page = await productControllerGetUncategorizedInfinite({
        ...queryParams,
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
    [queryParams],
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
