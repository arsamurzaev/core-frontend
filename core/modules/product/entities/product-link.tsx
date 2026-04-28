"use client";

import { saveProductDrawerPreview } from "@/core/widgets/product-drawer/model/product-drawer-preview";
import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import { buildProductHrefWithCatalogQuery } from "@/shared/lib/product-route";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";

interface ProductLinkProps extends React.PropsWithChildren {
  slug: string;
  className?: string;
  product?: ProductWithAttributesDto;
  scroll?: boolean;
}

export const ProductLink: React.FC<ProductLinkProps> = ({
  slug,
  className,
  product,
  scroll = false,
  children,
}) => {
  const searchParams = useSearchParams();
  const href = React.useMemo(
    () => buildProductHrefWithCatalogQuery(slug, searchParams),
    [searchParams, slug],
  );

  return (
    <Link
      href={href}
      scroll={scroll}
      className={cn(className)}
      onPointerDown={() => {
        if (product) {
          saveProductDrawerPreview(product);
        }
      }}
    >
      {children}
    </Link>
  );
};
