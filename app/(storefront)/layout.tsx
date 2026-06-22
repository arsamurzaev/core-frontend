import { CartProvider } from "@/core/modules/cart";
import {
  IikoSyncProgressWatcherSlot,
  MoySkladSyncProgressWatcherSlot,
  ProductDrawerInstantHostSlot,
} from "@/core/catalog-runtime/ui";
import { getCurrentCatalogServer } from "@/shared/api/server/get-current-catalog";
import { resolveServerForwardedHost } from "@/shared/api/server/get-current-catalog";
import { isPlatformHost } from "@/shared/platform/platform-host";
import { DrawerCoordinatorProvider } from "@/shared/providers/drawer-coordinator-provider";
import { notFound } from "next/navigation";

export default async function StorefrontLayout({
  children,
  drawer,
}: Readonly<{
  children: React.ReactNode;
  drawer: React.ReactNode;
}>) {
  const forwardedHost = await resolveServerForwardedHost();
  if (isPlatformHost(forwardedHost)) {
    return <>{children}</>;
  }

  const catalog = await getCurrentCatalogServer();

  if (!catalog) {
    notFound();
  }

  return (
    <DrawerCoordinatorProvider>
      <CartProvider>
        <MoySkladSyncProgressWatcherSlot />
        <IikoSyncProgressWatcherSlot />
        {children}
        <ProductDrawerInstantHostSlot />
        {drawer}
      </CartProvider>
    </DrawerCoordinatorProvider>
  );
}
