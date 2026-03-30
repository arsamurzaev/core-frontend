import { getCurrentCatalogServer } from "@/shared/api/server/get-current-catalog";
import { getCurrentSessionServer } from "@/shared/api/server/get-current-session";
import { AppProvider } from "@/shared/providers/app-provider";
import { ConfirmationProvider } from "@/shared/ui/confirmation";
import { Toaster } from "@/shared/ui/sonner";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sfProText } from "./font";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catalog Frontend",
  description: "Клиент каталога с корзиной, фильтрами и управлением товарами.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [data, initialSession] = await Promise.all([
    getCurrentCatalogServer(),
    getCurrentSessionServer(),
  ]);

  if (!data) {
    notFound();
  }

  return (
    <html lang="ru">
      <body className={`${sfProText.className} antialiased min-h-svh`}>
        <AppProvider initialCatalog={data} initialSession={initialSession}>
          {children}
        </AppProvider>
        <ConfirmationProvider />
        <Toaster />
      </body>
    </html>
  );
}
