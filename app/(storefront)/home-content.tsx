import {
  CartDrawerSlot,
  CatalogBrowserSlot,
  CatalogHeaderSlot,
  EditProductDrawerHostProviderSlot,
} from "@/core/catalog-runtime/ui";
import { BackgroundImage } from "@/core/views/home/_ui/background-image";
import { Footer } from "@/core/widgets/footer/ui/footer";
import { PopularProductCarousel } from "@/core/widgets/popular-product-carousel/ui/popular-product-carousel";
import { getCurrentCatalogServer } from "@/shared/api/server/get-current-catalog";
import { getHomePageDataServer } from "@/shared/api/server/get-home-page-data";
import { isBusinessCardCatalog } from "@/shared/lib/catalog-presentation-mode";
import { cn } from "@/shared/lib/utils";
import { ContentContainer } from "@/shared/ui/layout/content-container";
import React, { Suspense } from "react";
import { HomeCatalogFallback } from "./home-catalog-fallback";

interface Props {
  className?: string;
}

export const HomeContent = async ({ className }: Props) => {
  const catalog = await getCurrentCatalogServer();
  const isBusinessCardMode = isBusinessCardCatalog(catalog);
  const { categories, popularProducts } = isBusinessCardMode
    ? { categories: [], popularProducts: [] }
    : await getHomePageDataServer();

  return (
    <main className={cn(isBusinessCardMode && "min-h-svh", className)}>
      <ContentContainer
        className={cn(isBusinessCardMode && "flex min-h-svh flex-col")}
      >
        <BackgroundImage />
        <EditProductDrawerHostProviderSlot>
          <div
            rel="content"
            className={cn(
              "px-2.5",
              isBusinessCardMode ? "flex flex-1 flex-col gap-10" : "space-y-8",
            )}
          >
            <CatalogHeaderSlot />
            {isBusinessCardMode ? null : (
              <Suspense fallback={<HomeCatalogFallback />}>
                <PopularProductCarousel initialProducts={popularProducts} />
                <CatalogBrowserSlot initialCategories={categories} />
              </Suspense>
            )}
            <Footer
              className={cn(isBusinessCardMode && "mt-auto pt-10 pb-12")}
            />
          </div>
        </EditProductDrawerHostProviderSlot>
        {isBusinessCardMode ? null : <CartDrawerSlot />}
      </ContentContainer>
    </main>
  );
};
