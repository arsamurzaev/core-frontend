"use client";

import {
  CartProductAction,
  CartProductCardFooterAction,
  useCart,
} from "@/core/modules/cart";
import { ProductCardRuntime } from "@/core/catalog-runtime/ui";
import {
  isIikoProduct,
  isMoySkladProduct,
  ProductLink,
  ToggleProductPopularAction,
} from "@/core/modules/product";
import { EditProductCardAction } from "@/core/widgets/edit-product-drawer/ui/edit-product-card-action";
import {
  ProductWithAttributesDtoStatus,
  type ProductWithAttributesDto,
  useProductControllerGetPopularCards,
} from "@/shared/api/generated/react-query";
import {
  canManageCatalogContent,
  isChildCatalog,
} from "@/shared/lib/catalog-content-access";
import { cn } from "@/shared/lib/utils";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/shared/ui/carousel";
import { useSession } from "@/shared/providers/session-provider";
import { useCatalogState } from "@/shared/providers/catalog-provider";
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
  const [isMounted, setIsMounted] = React.useState(false);
  const { quantityByProductId, shouldUseCartUi } = useCart();
  const { isAuthenticated } = useSession();
  const { catalog } = useCatalogState();
  const canManageContent = canManageCatalogContent(catalog);
  const shouldRenderCartUi = isMounted && shouldUseCartUi;
  const showParentCatalogHiddenStatus =
    isAuthenticated && isChildCatalog(catalog);

  const { isLoading, data } = useProductControllerGetPopularCards({
    query: {
      initialData: initialProducts,
      staleTime: 60_000,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  });

  const slideCount = data?.length ?? 0;

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

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
          {data?.map((product) => {
            const shouldShowParentHiddenStatus =
              showParentCatalogHiddenStatus &&
              product.status === ProductWithAttributesDtoStatus.HIDDEN;
            const shouldRenderProductCartUi =
              shouldRenderCartUi && !shouldShowParentHiddenStatus;
            const shouldShowProductAdminActions =
              !shouldRenderProductCartUi && isAuthenticated && canManageContent;
            const card = (
              <ProductCardRuntime
                data={product}
                isDetailed
                isIikoLinked={
                  shouldShowProductAdminActions && isIikoProduct(product)
                }
                isMoySkladLinked={
                  shouldShowProductAdminActions && isMoySkladProduct(product)
                }
                actions={
                  shouldShowProductAdminActions ? (
                    <EditProductCardAction
                      isIikoLinked={isIikoProduct(product)}
                      isMoySkladLinked={isMoySkladProduct(product)}
                      productId={product.id}
                      status={product.status}
                    />
                  ) : undefined
                }
                hidePriceWhenFooterAction={shouldRenderProductCartUi}
                reserveHeaderActionSpace={shouldRenderProductCartUi}
                footerAction={
                  shouldRenderProductCartUi &&
                  (quantityByProductId[product.id] ?? 0) > 0 ? (
                    <CartProductCardFooterAction product={product} isDetailed />
                  ) : shouldShowProductAdminActions ? (
                    <ToggleProductPopularAction
                      productId={product.id}
                      isPopular={Boolean(product.isPopular)}
                    />
                  ) : undefined
                }
              />
            );

            return (
              <CarouselItem key={product.id}>
                <article className="relative">
                  {shouldShowParentHiddenStatus ? (
                    <div className="m-1 block rounded-panel">{card}</div>
                  ) : (
                    <ProductLink
                      slug={product.slug}
                      product={product}
                      className="m-1 block rounded-panel ring-offset-surface-base transition outline-none focus-visible:ring-2 focus-visible:ring-action-primary/50 focus-visible:ring-offset-2"
                    >
                      {card}
                    </ProductLink>
                  )}
                  {shouldRenderProductCartUi ? (
                    <CartProductAction product={product} />
                  ) : null}
                  {shouldShowParentHiddenStatus ? (
                    <EditProductCardAction
                      isIikoLinked={isIikoProduct(product)}
                      isMoySkladLinked={isMoySkladProduct(product)}
                      productId={product.id}
                      status={product.status}
                    />
                  ) : null}
                </article>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        <ul className="flex min-h-1 justify-center gap-1">
          {slideCount > 0 &&
            Array.from({ length: slideCount }).map((_, index) => (
              <li
                key={index}
                className={cn(
                  "h-1 w-2 rounded-pill bg-action-primary transition-all",
                  currentIndex === index && "w-24",
                )}
              />
            ))}
        </ul>
      </Carousel>
    </section>
  );
};
