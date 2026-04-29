import { CartProvider } from "@/core/modules/cart/model/cart-context";
import { ProductDrawerInstantHost } from "@/core/widgets/product-drawer/ui/product-drawer-instant-host";

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
      <ProductDrawerInstantHost />
      {drawer}
    </CartProvider>
  );
}
