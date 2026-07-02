import { canOpenStorefrontProductPage } from "@/core/catalog-runtime/server";
import { HomeContent } from "@/core/views/home";
import { ProductDrawerRoute } from "@/core/widgets/product-drawer";
import {
  getProductPageDataServer,
  getProductPageStructuredData,
  normalizeProductSlug,
} from "@/core/widgets/product-drawer/server";
import { getCurrentCatalogServer } from "@/shared/api/server/get-current-catalog";
import { notFound } from "next/navigation";

interface ProductPageContentProps {
  slug: string;
}

export const ProductPageContent = async ({ slug }: ProductPageContentProps) => {
  const catalog = await getCurrentCatalogServer();
  if (!canOpenStorefrontProductPage(catalog)) {
    notFound();
  }

  const productSlug = normalizeProductSlug(slug);
  const { product: initialProduct, seo } =
    await getProductPageDataServer(productSlug);
  const structuredData = getProductPageStructuredData(seo?.structuredData);

  return (
    <>
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: structuredData }}
        />
      ) : null}
      <HomeContent />
      <ProductDrawerRoute
        productSlug={productSlug}
        closeStrategy="push-home"
        initialProduct={initialProduct}
      />
    </>
  );
};
