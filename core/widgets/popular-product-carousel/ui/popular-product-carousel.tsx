"use client";

import { ProductCard } from "@/core/modules/product/entities/product-card";
import { ProductLink } from "@/core/modules/product/entities/product-link";
import { isMoySkladProduct } from "@/core/modules/product/model/moysklad-product";
import { EditProductCardAction } from "@/core/widgets/edit-product-drawer/ui/edit-product-card-action";
import { ToggleProductPopularAction } from "@/core/modules/product/actions/ui/toggle-product-popular-action";
import { useProductControllerGetPopular } from "@/shared/api/generated";
import { cn } from "@/shared/lib/utils";
import { useSession } from "@/shared/providers/session-provider";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/shared/ui/carousel";
import React, { Suspense } from "react";
import { PopularProductCarouselSkeleton } from "./skeleton/popular-product-carousel-skeleton";

interface Props {
  className?: string;
}

export const PopularProductCarousel: React.FC<Props> = ({ className }) => {
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const { isAuthenticated } = useSession();

  const { isLoading, data } = useProductControllerGetPopular();

  const slideCount = data?.length ?? 0;

  const syncCurrentIndex = React.useCallback(() => {
    if (!api) {
      setCurrentIndex(0);
      return;
    }

    const snapCount = api.scrollSnapList().length;
    if (snapCount === 0) {
      setCurrentIndex(0);
      return;
    }

    setCurrentIndex(Math.min(api.selectedScrollSnap(), snapCount - 1));
  }, [api]);

  React.useEffect(() => {
    if (!api) {
      setCurrentIndex(0);
      return;
    }

    syncCurrentIndex();
    api.on("select", syncCurrentIndex);
    api.on("reInit", syncCurrentIndex);

    return () => {
      api.off("select", syncCurrentIndex);
      api.off("reInit", syncCurrentIndex);
    };
  }, [api, syncCurrentIndex]);

  React.useLayoutEffect(() => {
    if (!api) {
      setCurrentIndex(0);
      return;
    }

    api.reInit();
    syncCurrentIndex();
  }, [api, slideCount, syncCurrentIndex]);

  if (isLoading) {
    return <PopularProductCarouselSkeleton />;
  }

  if (!isLoading && !data?.length) {
    return null;
  }
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-bold">Популярное</h2>
      <Carousel setApi={setApi} className={cn("space-y-3", className)}>
        <CarouselContent>
          {data?.map((product) => (
            <CarouselItem key={product.id}>
              <article className="relative">
                <Suspense>
                  <ProductLink
                    slug={product.slug}
                    className="m-1 block rounded-lg outline-none ring-offset-2 transition focus-visible:ring-2"
                  >
                    <ProductCard
                      data={product}
                      isDetailed
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
                </Suspense>
                <EditProductCardAction
                  isMoySkladLinked={isMoySkladProduct(product)}
                  productId={product.id}
                  status={product.status}
                />
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>

        <ul className="flex justify-center gap-1 min-h-1">
          {slideCount > 0 &&
            Array.from({ length: slideCount }).map((_, index) => (
              <li
                key={index}
                className={cn(
                  "bg-primary h-1 w-2 rounded-full transition-all",
                  currentIndex === index && "w-24",
                )}
              />
            ))}
        </ul>
      </Carousel>
    </section>
  );
};
