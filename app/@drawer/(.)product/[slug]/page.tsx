import { getProductBySlugServer } from "@/core/widgets/product-drawer/lib/get-product-by-slug.server";
import { ProductDrawerRoute } from "@/core/widgets/product-drawer/ui/product-drawer-route";

interface ProductDrawerRoutePageProps {
  params: Promise<{ slug: string }>;
}

function normalizeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export default async function ProductDrawerRoutePage({
  params,
}: ProductDrawerRoutePageProps) {
  const { slug } = await params;
  const productSlug = normalizeSlug(slug);
  const initialProduct = await getProductBySlugServer(productSlug);

  return (
    <ProductDrawerRoute
      productSlug={productSlug}
      closeStrategy="back-or-home"
      initialProduct={initialProduct}
    />
  );
}
