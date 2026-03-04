"use client";

import { cn } from "@/shared/lib/utils";
import { buildProductHrefWithCatalogQuery } from "@/shared/lib/product-route";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";

interface ProductLinkProps extends React.PropsWithChildren {
  slug: string;
  className?: string;
  scroll?: boolean;
}

export const ProductLink: React.FC<ProductLinkProps> = ({
  slug,
  className,
  scroll = false,
  children,
}) => {
  const searchParams = useSearchParams();
  const href = React.useMemo(
    () => buildProductHrefWithCatalogQuery(slug, searchParams),
    [searchParams, slug],
  );

  return (
    <Link href={href} scroll={scroll} className={cn(className)}>
      {children}
    </Link>
  );
};
