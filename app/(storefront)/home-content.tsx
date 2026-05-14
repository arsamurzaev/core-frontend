import {
  CartDrawerSlot,
  CatalogBrowserSlot,
  CatalogHeaderSlot,
  EditProductDrawerHostProviderSlot,
} from "@/core/catalog-runtime/ui";
import { BackgroundImage } from "@/core/views/home/_ui/background-image";
import { Footer } from "@/core/widgets/footer/ui/footer";
import { PopularProductCarousel } from "@/core/widgets/popular-product-carousel/ui/popular-product-carousel";
import { getHomePageDataServer } from "@/shared/api/server/get-home-page-data";
import { cn } from "@/shared/lib/utils";
import { ContentContainer } from "@/shared/ui/layout/content-container";
import React, { Suspense } from "react";

interface Props {
  className?: string;
}

export const HomeContent = async ({ className }: Props) => {
  const { categories, popularProducts } = await getHomePageDataServer();

  return (
    <main className={cn(className)}>
      <ContentContainer>
        <BackgroundImage />
        <EditProductDrawerHostProviderSlot>
          <div rel="content" className="space-y-8 px-2.5">
            <CatalogHeaderSlot />
            <Suspense>
              <PopularProductCarousel initialProducts={popularProducts} />
              <CatalogBrowserSlot initialCategories={categories} />
            </Suspense>
            <Footer />
          </div>
        </EditProductDrawerHostProviderSlot>
        <CartDrawerSlot />
      </ContentContainer>
    </main>
  );
};
