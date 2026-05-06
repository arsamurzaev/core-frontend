import type {
  CatalogCurrentDto,
  MediaDto,
} from "@/shared/api/generated/react-query";
import type { Metadata } from "next";

const DEFAULT_CATALOG_TITLE = "Мой Каталог";
const DEFAULT_CATALOG_DESCRIPTION =
  "Клиент каталога с корзиной, фильтрами и управлением товарами.";

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
    /^https?:\/\//i.test(resolvedHost)
      ? resolvedHost
      : `https://${resolvedHost}`,
  );
}

function toAbsoluteUrl(value: string, metadataBase: URL): string {
  try {
    return new URL(value, metadataBase).toString();
  } catch {
    return metadataBase.toString();
  }
}

function resolveCanonicalUrl(
  catalog: CatalogCurrentDto,
  metadataBase: URL,
): string {
  const canonicalUrl = normalizeText(catalog.seo?.canonicalUrl);

  if (canonicalUrl) {
    return toAbsoluteUrl(canonicalUrl, metadataBase);
  }

  const urlPath = normalizeText(catalog.seo?.urlPath);

  if (urlPath) {
    return toAbsoluteUrl(urlPath, metadataBase);
  }

  return metadataBase.toString();
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

function appendVersionToUrl(url: string, version: string | undefined): string {
  if (!version) {
    return url;
  }

  try {
    const resolved = new URL(url);
    resolved.searchParams.set("v", version);
    return resolved.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${encodeURIComponent(version)}`;
  }
}

function resolveIconDescriptor(
  media: MediaDto | null | undefined,
  metadataBase: URL,
  version: string | undefined,
) {
  const url = normalizeText(media?.url);

  if (!url) {
    return undefined;
  }

  const absoluteUrl = toAbsoluteUrl(url, metadataBase);

  return {
    url: appendVersionToUrl(absoluteUrl, version),
    type: normalizeText(media?.mimeType) ?? undefined,
    sizes:
      media?.width && media?.height
        ? `${media.width}x${media.height}`
        : undefined,
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

function resolveDescription(catalog: CatalogCurrentDto): string | undefined {
  return (
    normalizeText(catalog.seo?.description) ??
    normalizeText(catalog.config?.description) ??
    normalizeText(catalog.config?.about) ??
    undefined
  );
}

export function buildCatalogMetadata(
  catalog: CatalogCurrentDto,
  forwardedHost: string,
): Metadata {
  const metadataBase = resolveMetadataBase(forwardedHost, catalog.domain);
  const siteName = normalizeText(catalog.name) ?? DEFAULT_CATALOG_TITLE;
  const title = normalizeText(catalog.seo?.title) ?? siteName;
  const description =
    resolveDescription(catalog) ?? DEFAULT_CATALOG_DESCRIPTION;
  const canonicalUrl = resolveCanonicalUrl(catalog, metadataBase);
  const ogUrl = normalizeText(catalog.seo?.ogUrl);
  const ogImage = resolveSocialImage(
    catalog.seo?.ogMedia ?? catalog.config?.logoMedia,
    metadataBase,
  );
  const twitterImage = resolveSocialImage(
    catalog.seo?.twitterMedia ??
      catalog.seo?.ogMedia ??
      catalog.config?.logoMedia,
    metadataBase,
  );
  const twitterCard = resolveTwitterCard(
    catalog.seo?.twitterCard,
    Boolean(twitterImage),
  );
  const googleVerification = normalizeText(
    catalog.settings?.googleVerification,
  );
  const yandexVerification = normalizeText(
    catalog.settings?.yandexVerification,
  );
  const rawRobots = normalizeText(catalog.seo?.robots);
  const iconDescriptor = resolveIconDescriptor(
    catalog.seo?.faviconMedia ?? catalog.config?.logoMedia,
    metadataBase,
    catalog.updatedAt ?? catalog.seo?.updatedAt ?? undefined,
  );

  return {
    metadataBase,
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    applicationName: siteName,
    keywords: normalizeKeywords(catalog.seo?.keywords),
    robots: rawRobots ?? {
      index: catalog.seo?.isIndexable ?? true,
      follow: catalog.seo?.isFollowable ?? true,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    verification:
      googleVerification || yandexVerification
        ? {
            google: googleVerification,
            yandex: yandexVerification,
          }
        : undefined,
    icons: iconDescriptor
      ? {
          icon: [iconDescriptor],
          shortcut: [iconDescriptor.url],
          apple: [iconDescriptor],
        }
      : undefined,
    openGraph: {
      type: resolveOpenGraphType(catalog.seo?.ogType),
      url: ogUrl ? toAbsoluteUrl(ogUrl, metadataBase) : canonicalUrl,
      title: normalizeText(catalog.seo?.ogTitle) ?? title,
      description: normalizeText(catalog.seo?.ogDescription) ?? description,
      siteName: normalizeText(catalog.seo?.ogSiteName) ?? siteName,
      locale: normalizeText(catalog.seo?.ogLocale) ?? undefined,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: twitterCard,
      site: normalizeText(catalog.seo?.twitterSite) ?? undefined,
      creator: normalizeText(catalog.seo?.twitterCreator) ?? undefined,
      title: normalizeText(catalog.seo?.twitterTitle) ?? title,
      description:
        normalizeText(catalog.seo?.twitterDescription) ?? description,
      images: twitterImage ? [twitterImage] : undefined,
    },
    other: parseOtherMeta(catalog.seo?.extras),
  };
}

export function getCatalogStructuredData(
  catalog: CatalogCurrentDto,
): string | null {
  const raw = normalizeText(catalog.seo?.structuredData);

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

export function getCatalogHtmlLang(catalog: CatalogCurrentDto): string {
  const rawLang =
    normalizeText(catalog.seo?.hreflang) ??
    normalizeText(catalog.seo?.ogLocale);

  if (!rawLang) {
    return "ru";
  }

  return rawLang.split(/[-_]/)[0]?.toLowerCase() || "ru";
}
