import { CartProvider } from "@/core/modules/cart";
import {
  IikoSyncProgressWatcherSlot,
  MoySkladSyncProgressWatcherSlot,
  ProductDrawerInstantHostSlot,
} from "@/core/catalog-runtime/ui";
import {
  getCurrentCatalogServer,
  resolveServerForwardedHost,
} from "@/shared/api/server/get-current-catalog";
import { isPlatformHost } from "@/shared/platform/platform-host";
import { DrawerCoordinatorProvider } from "@/shared/providers/drawer-coordinator-provider";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

interface StorefrontShellProps {
  children: ReactNode;
  drawer: ReactNode;
}

export const StorefrontShell = async ({
  children,
  drawer,
}: StorefrontShellProps) => {
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
};
