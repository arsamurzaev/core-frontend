import {
  generateProductPageMetadata,
  getProductPageDataServer,
  getProductPageStructuredData,
  normalizeProductSlug,
} from "@/core/widgets/product-drawer/lib/product-page.server";
import { ProductDrawerRoute } from "@/core/widgets/product-drawer/ui/product-drawer-route";
import type { Metadata } from "next";

interface ProductDrawerRoutePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductDrawerRoutePageProps): Promise<Metadata> {
  const { slug } = await params;
  return generateProductPageMetadata(normalizeProductSlug(slug));
}

export default async function ProductDrawerRoutePage({
  params,
}: ProductDrawerRoutePageProps) {
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
      <ProductDrawerRoute
        productSlug={productSlug}
        closeStrategy="back"
        initialProduct={initialProduct}
      />
    </>
  );
}
