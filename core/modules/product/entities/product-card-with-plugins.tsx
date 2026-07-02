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

  return data;
}

export const ProductCardWithPlugins: React.FC<ProductCardWithPluginsProps> = ({
  data,
  className,
  actions,
  footerAction,
  hidePriceWhenFooterAction,
  imageLoading,
  isIikoLinked,
  isMoySkladLinked,
  isDetailed,
  reserveHeaderActionSpace,
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
  const variantsLine = model.lines.find((line) => line.id === "variants");
  const visibleLines = model.lines.filter(
    (line) => line.id !== "variants" && line.value !== variantsLine?.value,
  );

  return (
    <div className={cn("flex flex-col gap-2", pluginContainerClassName)}>
      <ProductCard
        data={baseCardData}
        className={cn("flex-1", className)}
        actions={actions}
        footerAction={footerAction}
        headerMeta={variantsLine?.value}
        hidePriceWhenFooterAction={hidePriceWhenFooterAction}
        imageLoading={imageLoading}
        isIikoLinked={isIikoLinked}
        isMoySkladLinked={isMoySkladLinked}
        isDetailed={isDetailed}
        reserveHeaderActionSpace={reserveHeaderActionSpace}
      />
      {(model.badges.length > 0 || visibleLines.length > 0) && (
        <div className="shrink-0 px-2 pb-1 space-y-1">
          {model.badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {model.badges.map((badge) => (
                <Badge key={badge} variant="outline" className="text-[10px]">
                  {badge}
                </Badge>
              ))}
            </div>
          )}
          {visibleLines.map((line) => (
            <p key={line.id} className="text-text-muted text-xs">
              <span className="text-text-primary font-medium">
                {line.label}:
              </span>{" "}
              {line.value}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
