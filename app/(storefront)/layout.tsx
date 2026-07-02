import { StorefrontShell } from "@/core/views/storefront";

export default async function StorefrontLayout({
  children,
  drawer,
}: Readonly<{
  children: React.ReactNode;
  drawer: React.ReactNode;
}>) {
  return <StorefrontShell drawer={drawer}>{children}</StorefrontShell>;
}
