"use client";

import { useCart } from "@/core/modules/cart/model/cart-context";
import { CartProductDrawerFooterAction } from "@/core/modules/cart/ui/cart-product-drawer-footer-action";
import { buildProductDrawerViewModel } from "@/core/widgets/product-drawer/model/product-drawer-view";
import { ProductDetailsPanel } from "@/core/widgets/product-drawer/ui/product-details-panel";
import type { ProductWithDetailsDto } from "@/shared/api/generated/react-query";
import { buildHomeHrefWithCatalogQuery } from "@/shared/lib/product-route";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { Button } from "@/shared/ui/button";
import { ContentContainer } from "@/shared/ui/layout/content-container";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";

interface ProductStandalonePageProps {
  product: ProductWithDetailsDto | null;
  productSlug: string;
}

export const ProductStandalonePage: React.FC<ProductStandalonePageProps> = ({
  product,
  productSlug,
}) => {
  const { catalog } = useCatalogState();
  const { shouldUseCartUi } = useCart();
  const searchParams = useSearchParams();
  const homeHref = React.useMemo(
    () => buildHomeHrefWithCatalogQuery(searchParams),
    [searchParams],
  );
  const viewModel = React.useMemo(
    () =>
      buildProductDrawerViewModel({
        catalog,
        isError: false,
        isLoading: false,
        product: product ?? undefined,
      }),
    [catalog, product],
  );

  return (
    <main className="min-h-svh bg-background">
      <ContentContainer className="px-2.5 py-3 sm:py-5">
        <div className="mx-auto flex max-w-[30rem] flex-col gap-3">
          <Button asChild variant="outline" className="w-fit rounded-full px-4">
            <Link href={homeHref} scroll={false}>
              <ArrowLeft className="size-4" />
              Назад к каталогу
            </Link>
          </Button>

          <section className="shadow-custom flex min-h-[calc(100svh-6rem)] flex-col overflow-hidden rounded-2xl border bg-background">
            <ProductDetailsPanel
              brandName={viewModel.brandName ?? undefined}
              className="min-h-0 flex-1"
              currency={viewModel.currency}
              description={viewModel.description}
              displayName={viewModel.displayName}
              displayPrice={viewModel.displayPrice}
              discount={viewModel.discount}
              footerAction={
                shouldUseCartUi && product?.id ? (
                  <CartProductDrawerFooterAction
                    product={product}
                    productId={product.id}
                  />
                ) : null
              }
              footerClassName="mx-0 rounded-none border-t bg-background px-6 py-4 shadow-none"
              hasDiscount={viewModel.hasDiscount}
              hasError={viewModel.hasError}
              imageUrls={viewModel.imageUrls}
              isLoading={false}
              price={viewModel.price}
              resetKey={productSlug}
              scrollAreaClassName="min-h-0 flex-1 overflow-auto"
              shareText={viewModel.shareText}
              subtitle={viewModel.subtitle}
              variantsSummary={viewModel.variantsSummary}
            />
          </section>
        </div>
      </ContentContainer>
    </main>
  );
};
