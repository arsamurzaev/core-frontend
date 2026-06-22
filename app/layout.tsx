import { YandexMetrika } from "@/shared/analytics/yandex-metrika";
import {
  getCurrentCatalogServer,
  resolveServerForwardedHost,
} from "@/shared/api/server/get-current-catalog";
import { getCurrentSessionServer } from "@/shared/api/server/get-current-session";
import {
  buildCatalogMetadata,
  getCatalogHtmlLang,
  getCatalogStructuredData,
} from "@/shared/lib/catalog-seo";
import { isPlatformHost } from "@/shared/platform/platform-host";
import { AppProvider } from "@/shared/providers/app-provider";
import { ConfirmationProvider } from "@/shared/ui/confirmation";
import { Toaster } from "@/shared/ui/sonner";
import type { Metadata, Viewport } from "next";
import { sfProText } from "./font";
import "./globals.css";

const fallbackMetadata: Metadata = {
  title: "Мой Каталог",
  description: "Каталог с корзиной, фильтрами и управлением товарами.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  const forwardedHost = await resolveServerForwardedHost();

  if (isPlatformHost(forwardedHost)) {
    return fallbackMetadata;
  }

  const catalog = await getCurrentCatalogServer();

  if (!catalog) {
    return fallbackMetadata;
  }

  return buildCatalogMetadata(catalog, forwardedHost);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const forwardedHost = await resolveServerForwardedHost();
  const disableCatalogLookup = isPlatformHost(forwardedHost);
  const data = disableCatalogLookup ? null : await getCurrentCatalogServer();
  const initialSession =
    !disableCatalogLookup && data ? await getCurrentSessionServer(data.id) : null;
  const structuredData = data ? getCatalogStructuredData(data) : null;
  const htmlLang = data ? getCatalogHtmlLang(data) : "ru";
  const yandexMetrikaCounterIds =
    data?.metrics
      .filter((metric) => metric.provider === "YANDEX")
      .map((metric) => metric.counterId) ?? [];

  return (
    <html lang={htmlLang}>
      <head>
        {structuredData ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: structuredData }}
          />
        ) : null}
      </head>
      <body className={`${sfProText.className} antialiased min-h-svh`}>
        <AppProvider
          initialCatalog={data}
          initialSession={initialSession}
          disableCatalogLookup={disableCatalogLookup}
        >
          {children}
        </AppProvider>
        <ConfirmationProvider />
        <Toaster />
        <YandexMetrika counterIds={yandexMetrikaCounterIds} />
      </body>
    </html>
  );
}
