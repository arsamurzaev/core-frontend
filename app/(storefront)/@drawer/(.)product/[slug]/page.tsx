import { ProductDrawerRouteContent } from "@/core/views/product";

interface ProductDrawerRoutePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDrawerRoutePage({
  params,
}: ProductDrawerRoutePageProps) {
  const { slug } = await params;

  return <ProductDrawerRouteContent slug={slug} />;
}
