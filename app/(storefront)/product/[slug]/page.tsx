import { HomeContent } from "@/core/views/home";
import { canOpenStorefrontProductPage } from "@/core/catalog-runtime/server";
import {
  generateProductPageMetadata,
  getProductPageDataServer,
  getProductPageStructuredData,
  normalizeProductSlug,
} from "@/core/widgets/product-drawer/server";
import { ProductDrawerRoute } from "@/core/widgets/product-drawer";
import { getCurrentCatalogServer } from "@/shared/api/server/get-current-catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  return generateProductPageMetadata(normalizeProductSlug(slug));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
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
}
