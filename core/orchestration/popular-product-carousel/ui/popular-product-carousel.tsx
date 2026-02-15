"use client";
import { ProductCard } from "@/core/modules/product/entities/product-card";
import { useProductControllerGetPopular } from "@/shared/api/generated";
import { cn } from "@/shared/lib/utils";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/shared/ui/carousel";
import Link from "next/link";
import React from "react";
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
    if (!api || !data) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api, data]);

  if (isLoading) {
    return <PopularProductCarouselSkeleton />;
  }

  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-bold">Популярное</h2>
      <Carousel setApi={setApi} className={cn("space-y-3", className)}>
        <CarouselContent>
          {data?.map((product) => (
            <CarouselItem key={product.id}>
              <Link
                href={`/product/${product.id}`}
                scroll={false}
                className="m-1 block rounded-lg outline-none ring-offset-2 transition focus-visible:ring-2"
              >
                <article>
                  <ProductCard
                    data={product}
                    isDetailed
                    className="transition-transform duration-200 hover:-translate-y-0.5"
                  />
                </article>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        {Boolean(count) && (
          <ul className="flex justify-center gap-1">
            {Array.from({ length: count }).map((_, index) => (
              <li
                className={cn(
                  "bg-primary h-1 w-2 rounded-full transition-all",
                  current === index + 1 && "w-24",
                )}
                key={index}
              />
            ))}
          </ul>
        )}
      </Carousel>
    </section>
  );
};
