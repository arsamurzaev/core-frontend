import type {
  CatalogCurrentDto,
  MediaDto,
  ProductWithDetailsDto,
  SeoDto,
} from "@/shared/api/generated/react-query";
import { resolveAttributes } from "@/shared/lib/attributes";
import type { Metadata } from "next";

const DEFAULT_PRODUCT_TITLE = "Товар";

const OPEN_GRAPH_TYPES = [
  "article",
  "book",
  "music.song",
  "music.album",
  "music.playlist",
  "music.radio_station",
  "profile",
  "website",
  "video.tv_show",
  "video.other",
  "video.movie",
  "video.episode",
] as const;

const TWITTER_CARDS = ["summary", "summary_large_image"] as const;

type OpenGraphType = (typeof OPEN_GRAPH_TYPES)[number];
type TwitterCard = (typeof TWITTER_CARDS)[number];

function normalizeText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeKeywords(
  value: string | null | undefined,
): string[] | undefined {
  const keywords = value
    ?.split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return keywords?.length ? Array.from(new Set(keywords)) : undefined;
}

function resolveMetadataBase(
  forwardedHost: string,
  domain: string | null | undefined,
): URL {
  const resolvedHost = normalizeText(domain) ?? normalizeText(forwardedHost);

  if (!resolvedHost) {
    return new URL("https://example.com");
  }

  return new URL(
    /^https?:\/\//i.test(resolvedHost) ? resolvedHost : `https://${resolvedHost}`,
  );
}

function toAbsoluteUrl(value: string, metadataBase: URL): string {
  try {
    return new URL(value, metadataBase).toString();
  } catch {
    return metadataBase.toString();
  }
}

function isOpenGraphType(value: string): value is OpenGraphType {
  return OPEN_GRAPH_TYPES.includes(value as OpenGraphType);
}

function resolveOpenGraphType(value: string | null | undefined): OpenGraphType {
  const normalized = normalizeText(value)?.toLowerCase();
  return normalized && isOpenGraphType(normalized) ? normalized : "website";
}

function isTwitterCard(value: string): value is TwitterCard {
  return TWITTER_CARDS.includes(value as TwitterCard);
}

function resolveTwitterCard(
  value: string | null | undefined,
  hasImage: boolean,
): TwitterCard {
  const normalized = normalizeText(value)?.toLowerCase();

  if (normalized && isTwitterCard(normalized)) {
    return normalized;
  }

  return hasImage ? "summary_large_image" : "summary";
}

function resolveSocialImage(
  media: MediaDto | null | undefined,
  metadataBase: URL,
) {
  const url = normalizeText(media?.url);

  if (!url) {
    return undefined;
  }

  return {
    url: toAbsoluteUrl(url, metadataBase),
    width: media?.width ?? undefined,
    height: media?.height ?? undefined,
    type: normalizeText(media?.mimeType) ?? undefined,
    alt: normalizeText(media?.originalName) ?? undefined,
  };
}

function normalizeOtherMetaValue(
  value: unknown,
): string | number | Array<string | number> | undefined {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (Array.isArray(value)) {
    const normalized = value.flatMap((item) => {
      if (typeof item === "string" || typeof item === "number") {
        return [item];
      }

      if (typeof item === "boolean") {
        return [item ? "true" : "false"];
      }

      return [];
    });

    return normalized.length ? normalized : undefined;
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return undefined;
}

function parseOtherMeta(
  value: string | null | undefined,
): Metadata["other"] | undefined {
  const raw = normalizeText(value);

  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }

    const entries = Object.entries(parsed).flatMap(([key, itemValue]) => {
      const normalized = normalizeOtherMetaValue(itemValue);
      return normalized === undefined ? [] : ([[key, normalized]] as const);
    });

    return entries.length ? Object.fromEntries(entries) : undefined;
  } catch {
    return undefined;
  }
}

function resolveProductPrimaryMedia(
  product: ProductWithDetailsDto,
): MediaDto | undefined {
  return product.media
    ?.slice()
    .sort((left, right) => left.position - right.position)[0]?.media;
}

function resolveProductCanonicalUrl(
  product: ProductWithDetailsDto,
  seo: SeoDto | null | undefined,
  metadataBase: URL,
): string {
  const canonicalUrl = normalizeText(seo?.canonicalUrl);

  if (canonicalUrl) {
    return toAbsoluteUrl(canonicalUrl, metadataBase);
  }

  const urlPath = normalizeText(seo?.urlPath);

  if (urlPath) {
    return toAbsoluteUrl(urlPath, metadataBase);
  }

  return toAbsoluteUrl(`/product/${encodeURIComponent(product.slug)}`, metadataBase);
}

function resolveProductDescription(
  product: ProductWithDetailsDto,
  catalog: CatalogCurrentDto | null,
  seo: SeoDto | null | undefined,
): string {
  const attrs = resolveAttributes(product.productAttributes);
  const attributeDescription =
    typeof attrs.description === "string" ? attrs.description : undefined;
  const subtitle =
    typeof attrs.subtitle === "string" ? attrs.subtitle : undefined;

  return (
    normalizeText(seo?.description) ??
    normalizeText(attributeDescription) ??
    normalizeText(subtitle) ??
    normalizeText(catalog?.config?.description) ??
    normalizeText(catalog?.config?.about) ??
    `${product.name} в каталоге`
  );
}

export function buildProductMetadata(params: {
  catalog: CatalogCurrentDto | null;
  forwardedHost: string;
  product: ProductWithDetailsDto;
  seo?: SeoDto | null;
}): Metadata {
  const { catalog, forwardedHost, product, seo } = params;
  const metadataBase = resolveMetadataBase(forwardedHost, catalog?.domain);
  const siteName =
    normalizeText(catalog?.name) ??
    normalizeText(catalog?.slug) ??
    DEFAULT_PRODUCT_TITLE;
  const title = normalizeText(seo?.title) ?? normalizeText(product.name) ?? DEFAULT_PRODUCT_TITLE;
  const description = resolveProductDescription(product, catalog, seo);
  const canonicalUrl = resolveProductCanonicalUrl(product, seo, metadataBase);
  const primaryMedia = resolveProductPrimaryMedia(product);
  const ogImage = resolveSocialImage(seo?.ogMedia ?? primaryMedia, metadataBase);
  const twitterImage = resolveSocialImage(
    seo?.twitterMedia ?? seo?.ogMedia ?? primaryMedia,
    metadataBase,
  );
  const twitterCard = resolveTwitterCard(
    seo?.twitterCard,
    Boolean(twitterImage),
  );

  return {
    metadataBase,
    title: {
      absolute: title,
    },
    description,
    keywords: normalizeKeywords(seo?.keywords),
    robots:
      normalizeText(seo?.robots) ?? {
        index: seo?.isIndexable ?? true,
        follow: seo?.isFollowable ?? true,
      },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: resolveOpenGraphType(seo?.ogType),
      url: normalizeText(seo?.ogUrl)
        ? toAbsoluteUrl(seo?.ogUrl ?? canonicalUrl, metadataBase)
        : canonicalUrl,
      title: normalizeText(seo?.ogTitle) ?? title,
      description: normalizeText(seo?.ogDescription) ?? description,
      siteName: normalizeText(seo?.ogSiteName) ?? siteName,
      locale: normalizeText(seo?.ogLocale) ?? undefined,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: twitterCard,
      site: normalizeText(seo?.twitterSite) ?? undefined,
      creator: normalizeText(seo?.twitterCreator) ?? undefined,
      title: normalizeText(seo?.twitterTitle) ?? title,
      description: normalizeText(seo?.twitterDescription) ?? description,
      images: twitterImage ? [twitterImage] : undefined,
    },
    other: parseOtherMeta(seo?.extras),
  };
}

export function getProductStructuredData(
  structuredData: string | null | undefined,
): string | null {
  const raw = normalizeText(structuredData);

  if (!raw) {
    return null;
  }

  try {
    return JSON.stringify(JSON.parse(raw))
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");
  } catch {
    return null;
  }
}
