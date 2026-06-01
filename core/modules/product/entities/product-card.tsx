"use client";

/* eslint-disable @next/next/no-img-element */

import type { ProductWithAttributesDto } from "@/shared/api/generated/react-query";
import { useCatalogCapabilities } from "@/shared/capabilities/catalog-capabilities";
import {
  formatCatalogPrice,
  getCatalogPriceFormatMode,
  type CatalogPriceFormatMode,
} from "@/shared/lib/price-format";
import { cn, getCatalogCurrency } from "@/shared/lib/utils";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { AspectRatio } from "@/shared/ui/aspect-ratio";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardSubTitle,
  CardTitle,
} from "@/shared/ui/card";
import { IikoIcon } from "@/shared/ui/icons/iiko-icon";
import { MoyskladIcon } from "@/shared/ui/icons/moysklad-icon";

import React from "react";
import { PRODUCT_CARD_GRID_BASE_HEIGHT_PX } from "../model/product-card-layout";
import { buildProductCardView } from "../model/product-card-view";

interface Props {
  actions?: React.ReactNode;
  className?: string;
  data: ProductWithAttributesDto;
  footerAction?: React.ReactNode;
  headerMeta?: React.ReactNode;
  hidePriceWhenFooterAction?: boolean;
  imageLoading?: React.ImgHTMLAttributes<HTMLImageElement>["loading"];
  isIikoLinked?: boolean;
  isMoySkladLinked?: boolean;
  isDetailed?: boolean;
  reserveHeaderActionSpace?: boolean;
}

interface ProductCardLayoutProps {
  children: React.ReactNode;
  className?: string;
  isDetailed?: boolean;
}

const ProductCardLayout: React.FC<ProductCardLayoutProps> = ({
  className,
  isDetailed,
  children,
}) => {
  return (
    <Card
      className={cn(
        "relative flex flex-col gap-2 overflow-hidden rounded-lg",
        isDetailed && "flex-row",
        className,
      )}
      style={
        isDetailed
          ? undefined
          : { minHeight: `max(100%, ${PRODUCT_CARD_GRID_BASE_HEIGHT_PX}px)` }
      }
    >
      {children}
    </Card>
  );
};

interface ProductCardContentProps {
  actions?: React.ReactNode;
  imageStatus?: string | null;
  imageFallbackUrl?: string;
  imageLoading?: React.ImgHTMLAttributes<HTMLImageElement>["loading"];
  imageUrl?: string;
  isIikoLinked?: boolean;
  isMoySkladLinked?: boolean;
}

const ProductCardContent: React.FC<ProductCardContentProps> = ({
  actions,
  imageStatus,
  imageFallbackUrl,
  imageLoading = "lazy",
  imageUrl,
  isIikoLinked = false,
  isMoySkladLinked = false,
}) => {
  const isImageProcessing =
    imageStatus === "UPLOADED" || imageStatus === "PROCESSING";
  const isImageFailed = imageStatus === "FAILED";
  const imageSources = React.useMemo(
    () =>
      Array.from(
        new Set(
          [imageUrl, imageFallbackUrl, "/not-found-photo.png"].filter(
            (value): value is string => Boolean(value?.trim()),
          ),
        ),
      ),
    [imageFallbackUrl, imageUrl],
  );
  const [imageSourceIndex, setImageSourceIndex] = React.useState(0);

  React.useEffect(() => {
    setImageSourceIndex(0);
  }, [imageSources]);

  const resolvedImageUrl =
    imageSources[imageSourceIndex] ?? "/not-found-photo.png";
  const handleImageError = React.useCallback(() => {
    setImageSourceIndex((currentIndex) =>
      currentIndex < imageSources.length - 1
        ? currentIndex + 1
        : currentIndex,
    );
  }, [imageSources.length]);

  React.useEffect(() => {
    if (imageLoading !== "eager" || typeof window === "undefined") {
      return;
    }

    const image = new Image();
    image.decoding = "async";
    image.src = resolvedImageUrl;
  }, [imageLoading, resolvedImageUrl]);

  const integrationMarker = isIikoLinked
    ? {
        icon: <IikoIcon />,
        label: "Товар из iiko",
      }
    : isMoySkladLinked
      ? {
          icon: <MoyskladIcon />,
          label: "Товар из MoySklad",
        }
      : null;

  return (
    <CardContent className="relative flex-[0_1_160px]">
      <div className="min-w-25">
        <AspectRatio ratio={3 / 4}>
          <img
            src={resolvedImageUrl}
            className="absolute inset-0 h-full w-full object-contain"
            alt="Карточка товара"
            loading={imageLoading}
            decoding="async"
            fetchPriority={imageLoading === "eager" ? "high" : "auto"}
            onError={handleImageError}
          />
          {isImageProcessing || isImageFailed ? (
            <div className="absolute inset-x-2 bottom-2 rounded-md bg-background/95 px-2 py-1 text-center text-[11px] font-medium shadow-custom">
              {isImageFailed ? "Фото не обработано" : "Фото обрабатывается"}
            </div>
          ) : null}
        </AspectRatio>
      </div>
      {integrationMarker ? (
        <div
          className="pointer-events-none absolute top-2 left-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 shadow-custom"
          title={integrationMarker.label}
          aria-label={integrationMarker.label}
        >
          {integrationMarker.icon}
        </div>
      ) : null}
      {actions}
    </CardContent>
  );
};

interface ProductCardHeaderProps {
  description: string;
  headerMeta?: React.ReactNode;
  isDetailed?: boolean;
  name: string;
  reserveActionSpace?: boolean;
  saleUnitsSummary?: string | null;
  subtitle: string;
}

const ProductCardHeaderSection: React.FC<ProductCardHeaderProps> = ({
  description,
  headerMeta,
  isDetailed,
  name,
  reserveActionSpace,
  saleUnitsSummary,
  subtitle,
}) => {
  const shouldReserveActionSpace = Boolean(reserveActionSpace && isDetailed);

  return (
    <CardHeader className="space-y-2 text-left">
      <CardTitle
        className={cn(
          "line-clamp-2",
          shouldReserveActionSpace && "pr-12",
          isDetailed && "sm:text-lg",
        )}
      >
        {name}
      </CardTitle>
      {headerMeta ? (
        <div className="line-clamp-2 text-xs leading-tight text-muted-foreground">
          {headerMeta}
        </div>
      ) : null}
      <CardSubTitle
        className={cn(
          "line-clamp-1",
          shouldReserveActionSpace && "pr-12",
          isDetailed && "sm:text-base",
        )}
      >
        {subtitle}
      </CardSubTitle>
      {saleUnitsSummary ? (
        <div className="line-clamp-1 text-xs leading-tight text-muted-foreground">
          {saleUnitsSummary}
        </div>
      ) : null}
      {isDetailed && (
        <p
          className={cn(
            "line-clamp-3 break-words whitespace-pre-wrap text-xs",
            isDetailed && "sm:text-sm",
          )}
        >
          {description}
        </p>
      )}
    </CardHeader>
  );
};

interface ProductCardFooterProps {
  currency: string;
  discount?: number;
  displayPrice: number | undefined;
  footerAction?: React.ReactNode;
  hasDiscount: boolean;
  hidePriceWhenFooterAction?: boolean;
  isDetailed?: boolean;
  price: number | undefined;
  priceFormatMode: CatalogPriceFormatMode;
  pricePrefix?: string | null;
}

const ProductCardFooterSection: React.FC<ProductCardFooterProps> = ({
  currency,
  discount,
  displayPrice,
  footerAction,
  hasDiscount,
  hidePriceWhenFooterAction,
  isDetailed,
  price,
  priceFormatMode,
  pricePrefix,
}) => {
  return (
    <CardFooter
      className={cn(
        "relative flex w-full flex-col items-end justify-center",
        isDetailed && "flex-row flex-wrap justify-end gap-x-3 gap-y-2 pt-4",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1",
          !isDetailed && "relative -right-2",
        )}
      >
        {hasDiscount && price !== undefined && (
          <>
            <p
              className={cn(
                "text-muted text-[10px] font-bold line-through",
                isDetailed && "pl-6 text-sm",
              )}
            >
              {formatCatalogPrice(price, priceFormatMode)} {currency}
            </p>
            <Badge
              className={cn(
                "relative",
                isDetailed && "absolute top-0 -right-2",
              )}
            >
              -{discount}%
            </Badge>
          </>
        )}
      </div>
      {footerAction}
      {displayPrice !== undefined ? (
        <p
          className={cn(
            "text-base font-bold whitespace-nowrap",
            !hasDiscount && "mt-4",
            footerAction && hidePriceWhenFooterAction && "hidden",
          )}
        >
          {pricePrefix ? `${pricePrefix} ` : null}
          {formatCatalogPrice(displayPrice, priceFormatMode)}{" "}
          <span className="font-normal">{currency}</span>
        </p>
      ) : null}
    </CardFooter>
  );
};

const ProductCardBase: React.FC<Props> = ({
  footerAction,
  headerMeta,
  hidePriceWhenFooterAction,
  imageLoading,
  isIikoLinked,
  isMoySkladLinked,
  isDetailed,
  reserveHeaderActionSpace,
  className,
  actions,
  data,
}) => {
  const { catalog } = useCatalogState();
  const features = useCatalogCapabilities();
  const fallbackCurrency = getCatalogCurrency(catalog, "RUB");
  const priceFormatMode = getCatalogPriceFormatMode(catalog);
  const {
    currency,
    description,
    discount,
    displayPrice,
    hasDiscount,
    imageFallbackUrl,
    imageUrl,
    imageStatus,
    price,
    pricePrefix,
    saleUnitsSummary,
    subtitle,
  } = buildProductCardView(data, {
    canUseVariants: features.canUseProductVariants,
    fallbackCurrency,
  });

  return (
    <ProductCardLayout className={className} isDetailed={isDetailed}>
      <ProductCardContent
        actions={actions}
        imageStatus={imageStatus}
        imageFallbackUrl={imageFallbackUrl}
        imageLoading={imageLoading}
        imageUrl={imageUrl}
        isIikoLinked={Boolean(isIikoLinked)}
        isMoySkladLinked={Boolean(isMoySkladLinked)}
      />
      <div
        className={cn(
          "flex flex-1 flex-col justify-between p-2 pt-0",
          isDetailed && "pt-2",
        )}
      >
        <ProductCardHeaderSection
          description={description}
          headerMeta={headerMeta}
          isDetailed={isDetailed}
          name={data.name}
          reserveActionSpace={reserveHeaderActionSpace}
          saleUnitsSummary={saleUnitsSummary}
          subtitle={subtitle}
        />
        <ProductCardFooterSection
          currency={currency}
          discount={discount}
          displayPrice={displayPrice}
          footerAction={footerAction}
          hasDiscount={hasDiscount}
          hidePriceWhenFooterAction={hidePriceWhenFooterAction}
          isDetailed={isDetailed}
          price={price}
          priceFormatMode={priceFormatMode}
          pricePrefix={pricePrefix}
        />
      </div>
    </ProductCardLayout>
  );
};

type ProductCardCompound = React.NamedExoticComponent<Props> & {
  Content: typeof ProductCardContent;
  Footer: typeof ProductCardFooterSection;
  Header: typeof ProductCardHeaderSection;
  Layout: typeof ProductCardLayout;
};

export const ProductCard: ProductCardCompound = Object.assign(
  React.memo(ProductCardBase),
  {
    Layout: ProductCardLayout,
    Content: ProductCardContent,
    Header: ProductCardHeaderSection,
    Footer: ProductCardFooterSection,
  },
);
