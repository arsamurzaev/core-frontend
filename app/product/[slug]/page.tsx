import { HomeContent } from "@/core/views/home/home-content";
import { ProductDrawerRoute } from "@/core/widgets/product-drawer/ui/product-drawer-route";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

function normalizeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const productSlug = normalizeSlug(slug);

  return (
    <>
      <HomeContent />
      <ProductDrawerRoute
        productSlug={productSlug}
        closeStrategy="replace-home"
      />
    </>
  );
}
