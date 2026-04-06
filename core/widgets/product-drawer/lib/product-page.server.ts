import { getCurrentCatalogServer, resolveServerForwardedHost } from "@/shared/api/server/get-current-catalog";
import {
  buildCatalogMetadata,
} from "@/shared/lib/catalog-seo";
import {
  buildProductMetadata,
  getProductStructuredData,
} from "@/shared/lib/product-seo";
import type { Metadata } from "next";
import { cache } from "react";
import { getProductBySlugServer } from "./get-product-by-slug.server";
import { getProductSeoByIdServer } from "./get-product-seo-by-id.server";

export function normalizeProductSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export const getProductPageDataServer = cache(async (productSlug: string) => {
  const product = await getProductBySlugServer(productSlug);
  const seo = product ? await getProductSeoByIdServer(product.id) : null;

  return {
    product,
    seo,
  };
});

export async function generateProductPageMetadata(
  productSlug: string,
): Promise<Metadata> {
  const [{ product, seo }, catalog, forwardedHost] = await Promise.all([
    getProductPageDataServer(productSlug),
    getCurrentCatalogServer(),
    resolveServerForwardedHost(),
  ]);

  if (!catalog) {
    return product
      ? buildProductMetadata({
          catalog: null,
          forwardedHost,
          product,
          seo,
        })
      : {};
  }

  if (!product) {
    return buildCatalogMetadata(catalog, forwardedHost);
  }

  return buildProductMetadata({
    catalog,
    forwardedHost,
    product,
    seo,
  });
}

export function getProductPageStructuredData(
  structuredData: string | null | undefined,
): string | null {
  return getProductStructuredData(structuredData);
}
