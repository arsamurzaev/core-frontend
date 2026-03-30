import { Browser } from "@/core/views/home/_ui/browser";
import { BackgroundImage } from "@/core/views/home/_ui/background-image";
import { LazyCartDrawer } from "@/core/widgets/cart-drawer/ui/lazy-cart-drawer";
import { EditProductDrawerHostProvider } from "@/core/widgets/edit-product-drawer/model/edit-product-drawer-host";
import { Footer } from "@/core/widgets/footer/ui/footer";
import { Header } from "@/core/widgets/header/ui/header";
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
        <EditProductDrawerHostProvider>
          <div rel="content" className="space-y-8 px-2.5">
            <Header />
            <Suspense>
              <PopularProductCarousel initialProducts={popularProducts} />
              <Browser initialCategories={categories} />
            </Suspense>
            <Footer />
          </div>
        </EditProductDrawerHostProvider>
        <LazyCartDrawer />
      </ContentContainer>
    </main>
  );
};
