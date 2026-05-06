import { CartProvider } from "@/core/modules/cart/model/cart-context";
import { PluginProductDrawerInstantHost } from "@/sandbox/ui/plugin-product-drawer-instant-host";
import { getCurrentCatalogServer } from "@/shared/api/server/get-current-catalog";
import { DrawerCoordinatorProvider } from "@/shared/providers/drawer-coordinator-provider";
import { notFound } from "next/navigation";

export default async function StorefrontLayout({
  children,
  drawer,
}: Readonly<{
  children: React.ReactNode;
  drawer: React.ReactNode;
}>) {
  const catalog = await getCurrentCatalogServer();

  if (!catalog) {
    notFound();
  }

  return (
    <DrawerCoordinatorProvider>
      <CartProvider>
        {children}
        <PluginProductDrawerInstantHost />
        {drawer}
      </CartProvider>
    </DrawerCoordinatorProvider>
  );
}
