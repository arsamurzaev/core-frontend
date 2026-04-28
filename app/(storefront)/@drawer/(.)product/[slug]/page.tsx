import { normalizeProductSlug } from "@/core/widgets/product-drawer/lib/product-page.server";
import { ProductDrawerRoute } from "@/core/widgets/product-drawer/ui/product-drawer-route";

interface ProductDrawerRoutePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDrawerRoutePage({
  params,
}: ProductDrawerRoutePageProps) {
  const { slug } = await params;
  const productSlug = normalizeProductSlug(slug);

  return (
    <ProductDrawerRoute
      productSlug={productSlug}
      closeStrategy="back"
    />
  );
}
