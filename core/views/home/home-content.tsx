import {
  CartDrawerSlot,
  CatalogBrowserSlot,
  CatalogHeaderSlot,
  EditProductDrawerHostProviderSlot,
} from "@/core/catalog-runtime/ui";
import { BackgroundImage } from "@/core/views/home/_ui/background-image";
import { HomeCatalogFallback } from "@/core/views/home/home-catalog-fallback";
import { Footer } from "@/core/widgets/footer";
import { PopularProductCarousel } from "@/core/widgets/popular-product-carousel";
import { getCatalogStorefrontComposition } from "@/core/catalog-runtime/server";
import { getCurrentCatalogServer } from "@/shared/api/server/get-current-catalog";
import { getHomePageDataServer } from "@/shared/api/server/get-home-page-data";
import { cn } from "@/shared/lib/utils";
import { ContentContainer } from "@/shared/ui/layout/content-container";
import React, { Suspense } from "react";

interface Props {
  className?: string;
}

export const HomeContent = async ({ className }: Props) => {
  const catalog = await getCurrentCatalogServer();
  const composition = getCatalogStorefrontComposition(catalog);
  const { categories, popularProducts } = composition.shouldLoadHomePageData
    ? await getHomePageDataServer()
    : { categories: [], popularProducts: [] };

  return (
    <main className={cn(composition.isBusinessCard && "min-h-svh", className)}>
      <ContentContainer
        className={cn(composition.isBusinessCard && "flex min-h-svh flex-col")}
      >
        <BackgroundImage />
        <EditProductDrawerHostProviderSlot>
          <div
            rel="content"
            className={cn(
              "px-2.5",
              composition.isBusinessCard
                ? "flex flex-1 flex-col gap-10"
                : "space-y-8",
            )}
          >
            <CatalogHeaderSlot />
            {composition.shouldRenderCatalogContent ? (
              <Suspense fallback={<HomeCatalogFallback />}>
                <PopularProductCarousel initialProducts={popularProducts} />
                <CatalogBrowserSlot initialCategories={categories} />
              </Suspense>
            ) : null}
            <Footer
              className={cn(composition.isBusinessCard && "mt-auto pt-10 pb-12")}
            />
          </div>
        </EditProductDrawerHostProviderSlot>
        {composition.shouldRenderCartDrawer ? <CartDrawerSlot /> : null}
      </ContentContainer>
    </main>
  );
};
