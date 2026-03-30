import { CartProvider } from "@/core/modules/cart/model/cart-context";

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
      {drawer}
    </CartProvider>
  );
}
