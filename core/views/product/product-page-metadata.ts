import {
  generateProductPageMetadata,
  normalizeProductSlug,
} from "@/core/widgets/product-drawer/server";
import type { Metadata } from "next";

export function generateProductPageViewMetadata(
  slug: string,
): Promise<Metadata> {
  return generateProductPageMetadata(normalizeProductSlug(slug));
}
