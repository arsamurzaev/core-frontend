import { CartProvider } from "@/core/modules/cart/model/cart-context";
import { PluginProductDrawerInstantHost } from "@/sandbox/ui/plugin-product-drawer-instant-host";

export default function StorefrontLayout({
  children,
  drawer,
}: Readonly<{
  children: React.ReactNode;
  drawer: React.ReactNode;
}>) {
  return (
    <CartProvider>
      {children}
      <PluginProductDrawerInstantHost />
      {drawer}
    </CartProvider>
  );
}
