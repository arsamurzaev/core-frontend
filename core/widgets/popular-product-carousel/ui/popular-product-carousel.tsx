"use client";

import { ProductCard } from "@/core/modules/product/entities/product-card";
import { ProductLink } from "@/core/modules/product/entities/product-link";
import { EditProductCardAction } from "@/core/widgets/edit-product-drawer/ui/edit-product-card-action";
import { useProductControllerGetPopular } from "@/shared/api/generated";
import { cn } from "@/shared/lib/utils";
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
  const [count, setCount] = React.useState(0);
  const [current, setCurrent] = React.useState(0);

  const { isLoading, data } = useProductControllerGetPopular();

  React.useEffect(() => {
    if (!api || !data) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api, data]);

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
                    <ProductCard data={product} isDetailed />
                  </ProductLink>
                </Suspense>
                <EditProductCardAction productId={product.id} />
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>

        <ul className="flex justify-center gap-1 min-h-1">
          {Boolean(count) &&
            Array.from({ length: count }).map((_, index) => (
              <li
                key={index}
                className={cn(
                  "bg-primary h-1 w-2 rounded-full transition-all",
                  current === index + 1 && "w-24",
                )}
              />
            ))}
        </ul>
      </Carousel>
    </section>
  );
};
