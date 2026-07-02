import {
  generateProductPageViewMetadata,
  ProductPageContent,
} from "@/core/views/product";
import type { Metadata } from "next";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  return generateProductPageViewMetadata(slug);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  return <ProductPageContent slug={slug} />;
}
