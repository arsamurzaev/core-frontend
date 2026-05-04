import { CatalogBrowser } from "@/sandbox/ui/catalog-browser";
import { BackgroundImage } from "@/core/views/home/_ui/background-image";
import { PluginCartDrawer } from "@/sandbox/ui/plugin-cart-drawer";
import { CatalogHeader } from "@/sandbox/ui/catalog-header";
import { PluginEditProductDrawerHostProvider } from "@/sandbox/ui/plugin-edit-product-drawer-host-provider";
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
        <PluginEditProductDrawerHostProvider>
          <div rel="content" className="space-y-8 px-2.5">
            <CatalogHeader />
            <Suspense>
              <PopularProductCarousel initialProducts={popularProducts} />
              <CatalogBrowser initialCategories={categories} />
            </Suspense>
            <Footer />
          </div>
        </PluginEditProductDrawerHostProvider>
        <PluginCartDrawer />
      </ContentContainer>
    </main>
  );
};
