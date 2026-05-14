import {
  getCurrentCatalogServer,
  resolveServerForwardedHost,
} from "@/shared/api/server/get-current-catalog";
import {
  buildProductMetadata,
  getProductStructuredData,
} from "@/shared/lib/product-seo";
import type { Metadata } from "next";
import { cache } from "react";
import {
  PRODUCT_UNAVAILABLE_STATE,
  isProductPubliclyAvailable,
} from "../model/product-availability";
import { getProductBySlugServer } from "./get-product-by-slug.server";
import { getProductSeoByIdServer } from "./get-product-seo-by-id.server";

export function normalizeProductSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function resolveMetadataBaseUrl(
  forwardedHost: string,
  domain: string | null | undefined,
): URL {
  const resolvedHost = (domain ?? forwardedHost).trim();
  return new URL(
    /^https?:\/\//i.test(resolvedHost)
      ? resolvedHost
      : `https://${resolvedHost}`,
  );
}

function buildGenericProductMetadata(
  productSlug: string,
  forwardedHost: string,
  domain: string | null | undefined,
): Metadata {
  const metadataBase = resolveMetadataBaseUrl(forwardedHost, domain);
  const fallbackTitle =
    productSlug
      .split(/[-_]+/g)
      .map((part) => part.trim())
      .filter(Boolean)
      .join(" ") || "Товар";

  return {
    metadataBase,
    title: {
      absolute: fallbackTitle,
    },
    description: `${fallbackTitle} в каталоге`,
    alternates: {
      canonical: new URL(
        `/product/${encodeURIComponent(productSlug)}`,
        metadataBase,
      ).toString(),
    },
  };
}

function buildUnavailableProductMetadata(
  productSlug: string,
  forwardedHost: string,
  domain: string | null | undefined,
): Metadata {
  const metadataBase = resolveMetadataBaseUrl(forwardedHost, domain);

  return {
    metadataBase,
    title: {
      absolute: PRODUCT_UNAVAILABLE_STATE.title,
    },
    description: PRODUCT_UNAVAILABLE_STATE.description,
    robots: {
      follow: false,
      index: false,
    },
    alternates: {
      canonical: new URL(
        `/product/${encodeURIComponent(productSlug)}`,
        metadataBase,
      ).toString(),
    },
  };
}

export const getProductPageDataServer = cache(async (productSlug: string) => {
  const product = await getProductBySlugServer(productSlug);
  const seo =
    product && isProductPubliclyAvailable(product)
      ? (product.seo ?? (await getProductSeoByIdServer(product.id)))
      : null;

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

  if (product && !isProductPubliclyAvailable(product)) {
    return buildUnavailableProductMetadata(
      productSlug,
      forwardedHost,
      catalog?.domain,
    );
  }

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
    return buildGenericProductMetadata(
      productSlug,
      forwardedHost,
      catalog.domain,
    );
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
