"use client";

import { ProductCard } from "@/core/modules/product/entities/product-card";
import { ProductCardSkeleton } from "@/core/modules/product/entities/product-card-skeleton";
import { ProductLink } from "@/core/modules/product/entities/product-link";
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
  forceActivation?: boolean;
  allowActivation?: boolean;
  allowLoadMore?: boolean;
}

export const CATEGORY_PRODUCTS_PAGE_SIZE = 24;
const SKELETON_ITEMS_COUNT = 4;

export const CategoryProducts: React.FC<Props> = ({
  className,
  category,
  sectionId,
  forceActivation = false,
  allowActivation = true,
  allowLoadMore = true,
}) => {
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const [isActivated, setIsActivated] = React.useState(false);

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

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setIsActivated(true);
        observer.disconnect();
      }
    });

    observer.observe(heading);

    return () => {
      observer.disconnect();
    };
  }, [allowActivation, isActivated]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
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

  const products = React.useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
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
      <ul
        className={cn(
          "grid grid-cols-[repeat(auto-fill,minmax(127px,1fr))] gap-4",
          //   `min-h-${detailed ? 4 * 318 : 4 * 160}px`,
          //   detailed && "grid-cols-1",
        )}
      >
        {isActivated &&
          isLoading &&
          Array.from({ length: SKELETON_ITEMS_COUNT }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        {products.map(({ productId, product }) => (
          <article key={productId}>
            <ProductLink slug={product.slug}>
              <ProductCard data={product} className="h-full" />
            </ProductLink>
          </article>
        ))}
        {isFetchingNextPage &&
          Array.from({ length: SKELETON_ITEMS_COUNT }).map((_, index) => (
            <ProductCardSkeleton key={`next-page-${index}`} />
          ))}
      </ul>
      <div ref={loadMoreRef} aria-hidden className="h-px w-full" />
    </div>
  );
};
