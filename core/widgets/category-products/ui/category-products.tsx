"use client";

import {
  PRODUCT_CARD_DETAILED_LAYOUT_CLASS_NAME,
  PRODUCT_CARD_GRID_LAYOUT_CLASS_NAME,
  useProductCardViewMode,
} from "@/core/modules/product/model/use-product-card-view-mode";
import { ProductCard } from "@/core/modules/product/entities/product-card";
import { ProductCardSkeleton } from "@/core/modules/product/entities/product-card-skeleton";
import { ProductLink } from "@/core/modules/product/entities/product-link";
import { EditProductCardAction } from "@/core/widgets/edit-product-drawer/ui/edit-product-card-action";
import {
  CategoryDto,
  categoryControllerGetProductsByCategory,
} from "@/shared/api/generated";
import { cn } from "@/shared/lib/utils";
import { useInfiniteQuery } from "@tanstack/react-query";
import React from "react";

interface Props {
  className?: string;
  category: CategoryDto;
  sectionId: string;
  initiallyActivated?: boolean;
  forceActivation?: boolean;
  allowActivation?: boolean;
  allowLoadMore?: boolean;
}

export const CATEGORY_PRODUCTS_PAGE_SIZE = 16;
const GRID_INITIAL_SKELETON_ITEMS_COUNT = CATEGORY_PRODUCTS_PAGE_SIZE;
const DETAILED_INITIAL_SKELETON_ITEMS_COUNT = 6;
const GRID_NEXT_PAGE_SKELETON_ITEMS_COUNT = 4;
const DETAILED_NEXT_PAGE_SKELETON_ITEMS_COUNT = 3;

export const CategoryProducts: React.FC<Props> = ({
  className,
  category,
  sectionId,
  initiallyActivated = false,
  forceActivation = false,
  allowActivation = true,
  allowLoadMore = true,
}) => {
  const { isDetailed } = useProductCardViewMode();
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
      queryKey: [
        "category-products-infinite",
        category.id,
        CATEGORY_PRODUCTS_PAGE_SIZE,
      ],
      queryFn: ({ pageParam }) =>
        categoryControllerGetProductsByCategory(category.id, {
          cursor: pageParam,
          limit: CATEGORY_PRODUCTS_PAGE_SIZE,
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
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

  return (
    <div id={sectionId} className={cn("space-y-7.5 min-h-90", className)}>
      <h2 ref={headingRef} className="pl-1 text-left text-xl font-bold">
        {category?.name}
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
            {products.map(({ productId, product }) => (
              <article key={productId} className="relative">
                <ProductLink slug={product.slug} className="block h-full">
                  <ProductCard
                    data={product}
                    isDetailed={isDetailed}
                    className={cn("h-full", isDetailed && "min-h-[160px]")}
                  />
                </ProductLink>
                <EditProductCardAction productId={product.id} />
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
