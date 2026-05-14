"use client";

import type {
  ProductWithAttributesDto,
  ProductWithDetailsDto,
} from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { Badge } from "@/shared/ui/badge";
import React from "react";
import { buildProductCardPluginModel } from "../plugins/build-model";
import type { ResolvedProductCardPlugin } from "../plugins/contracts";
import { ProductCard } from "./product-card";

type ProductCardBaseProps = Omit<
  React.ComponentProps<typeof ProductCard>,
  "data"
>;
type ProductCardEntity = ProductWithAttributesDto | ProductWithDetailsDto;

interface ProductCardWithPluginsProps extends ProductCardBaseProps {
  data: ProductCardEntity;
  plugin?: ResolvedProductCardPlugin;
  pluginContainerClassName?: string;
}

const DEFAULT_PRODUCT_CARD_PLUGIN: ResolvedProductCardPlugin = {
  key: "default",
  attributes: [],
  showVariants: true,
  badges: [],
};

function toProductWithAttributesDto(
  data: ProductCardEntity,
): ProductWithAttributesDto {
  if (!("variants" in data)) {
    return data;
  }

  return {
    id: data.id,
    sku: data.sku,
    name: data.name,
    slug: data.slug,
    price: data.price,
    media: data.media,
    brand: data.brand,
    productType: data.productType,
    categories: data.categories,
    integration: data.integration,
    isPopular: data.isPopular,
    status: data.status,
    position: data.position,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    productAttributes: data.productAttributes,
    variantSummary: data.variantSummary,
    variantPickerOptions: data.variantPickerOptions,
  };
}

export const ProductCardWithPlugins: React.FC<ProductCardWithPluginsProps> = ({
  data,
  className,
  actions,
  footerAction,
  hidePriceWhenFooterAction,
  isMoySkladLinked,
  isDetailed,
  plugin = DEFAULT_PRODUCT_CARD_PLUGIN,
  pluginContainerClassName,
}) => {
  const { catalog } = useCatalogState();
  const model = React.useMemo(
    () => buildProductCardPluginModel(data, catalog, plugin),
    [catalog, data, plugin],
  );
  const baseCardData = React.useMemo(
    () => toProductWithAttributesDto(data),
    [data],
  );

  return (
    <div className={cn("space-y-2", pluginContainerClassName)}>
      <ProductCard
        data={baseCardData}
        className={className}
        actions={actions}
        footerAction={footerAction}
        hidePriceWhenFooterAction={hidePriceWhenFooterAction}
        isMoySkladLinked={isMoySkladLinked}
        isDetailed={isDetailed}
      />
      {(model.badges.length > 0 || model.lines.length > 0) && (
        <div className="px-2 pb-1 space-y-1">
          {model.badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {model.badges.map((badge) => (
                <Badge key={badge} variant="outline" className="text-[10px]">
                  {badge}
                </Badge>
              ))}
            </div>
          )}
          {model.lines.map((line) => (
            <p key={line.id} className="text-muted text-xs">
              <span className="text-foreground font-medium">{line.label}:</span>{" "}
              {line.value}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
