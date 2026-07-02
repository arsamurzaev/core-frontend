import { ProductPageContent } from "@/core/views/product";
import {
  generateProductPageMetadata,
  normalizeProductSlug,
} from "@/core/widgets/product-drawer/server";
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

  return <ProductPageContent slug={slug} />;
}
