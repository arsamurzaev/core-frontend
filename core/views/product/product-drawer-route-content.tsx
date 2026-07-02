import { ProductDrawerRoute } from "@/core/widgets/product-drawer";
import { normalizeProductSlug } from "@/core/widgets/product-drawer/server";

interface ProductDrawerRouteContentProps {
  slug: string;
}

export const ProductDrawerRouteContent = ({
  slug,
}: ProductDrawerRouteContentProps) => {
  const productSlug = normalizeProductSlug(slug);

  return <ProductDrawerRoute productSlug={productSlug} closeStrategy="back" />;
};
