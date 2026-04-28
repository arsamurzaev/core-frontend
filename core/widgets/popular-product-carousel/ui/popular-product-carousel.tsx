"use client";

import { useCart } from "@/core/modules/cart/model/cart-context";
import { CartProductAction } from "@/core/modules/cart/ui/cart-product-action";
import { CartProductCardFooterAction } from "@/core/modules/cart/ui/cart-product-card-footer-action";
import { ProductCard } from "@/core/modules/product/entities/product-card";
import { ProductLink } from "@/core/modules/product/entities/product-link";
import { isMoySkladProduct } from "@/core/modules/product/model/moysklad-product";
import { EditProductCardAction } from "@/core/widgets/edit-product-drawer/ui/edit-product-card-action";
import {
  type ProductWithAttributesDto,
  useProductControllerGetPopularCards,
} from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/shared/ui/carousel";
import React from "react";
import { PopularProductCarouselSkeleton } from "./skeleton/popular-product-carousel-skeleton";

interface Props {
  className?: string;
  initialProducts?: ProductWithAttributesDto[];
}

export const PopularProductCarousel: React.FC<Props> = ({
  className,
  initialProducts = [],
}) => {
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const { quantityByProductId, shouldUseCartUi } = useCart();

  const { isLoading, data } = useProductControllerGetPopularCards({
    query: {
      initialData: initialProducts,
      staleTime: 60_000,
    },
  });

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
                <ProductLink
                  slug={product.slug}
                  product={product}
                  className="m-1 block rounded-lg outline-none ring-offset-2 transition focus-visible:ring-2"
                >
                  <ProductCard
                    data={product}
                    isDetailed
                    actions={
                      shouldUseCartUi ? (
                        <CartProductAction product={product} />
                      ) : (
                        <EditProductCardAction
                          isMoySkladLinked={isMoySkladProduct(product)}
                          productId={product.id}
                          status={product.status}
                        />
                      )
                    }
                    hidePriceWhenFooterAction={shouldUseCartUi}
                    footerAction={
                      shouldUseCartUi &&
                      (quantityByProductId[product.id] ?? 0) > 0 ? (
                        <CartProductCardFooterAction
                          product={product}
                          isDetailed
                        />
                      ) : undefined
                    }
                  />
                </ProductLink>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>

        <ul className="flex min-h-1 justify-center gap-1">
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
