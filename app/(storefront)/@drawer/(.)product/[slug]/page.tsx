import { ProductDrawerRoute } from "@/core/widgets/product-drawer";
import { normalizeProductSlug } from "@/core/widgets/product-drawer/server";

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
