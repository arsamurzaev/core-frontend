import { HomeContent } from "@/core/views/home/home-content";
import {
  generateProductPageMetadata,
  getProductPageDataServer,
  getProductPageStructuredData,
  normalizeProductSlug,
} from "@/core/widgets/product-drawer/lib/product-page.server";
import { ProductDrawerRoute } from "@/core/widgets/product-drawer/ui/product-drawer-route";
import type { Metadata } from "next";

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
