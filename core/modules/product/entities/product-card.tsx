import { ProductWithAttributesDto } from "@/shared/api/generated";
import { isMoySkladProduct } from "@/core/modules/product/model/moysklad-product";
import { cn } from "@/shared/lib/utils";
import { AspectRatio } from "@/shared/ui/aspect-ratio";
import { Badge } from "@/shared/ui/badge";
import { MoyskladIcon } from "@/shared/ui/icons/moysklad-icon";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardSubTitle,
  CardTitle,
} from "@/shared/ui/card";
import React from "react";
import { buildProductCardView } from "../model/product-card-view";

interface Props {
  actions?: React.ReactNode;
  className?: string;
  data: ProductWithAttributesDto;
  footerAction?: React.ReactNode;
  isMoySkladLinked?: boolean;
  isDetailed?: boolean;
  isVisiblePrice?: boolean;
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
    >
      {children}
    </Card>
  );
};

interface ProductCardContentProps {
  actions?: React.ReactNode;
  imageUrl?: string;
  isMoySkladLinked?: boolean;
}

const ProductCardContent: React.FC<ProductCardContentProps> = ({
  actions,
  imageUrl,
  isMoySkladLinked = false,
}) => {
  return (
    <CardContent className="relative flex-[0_1_160px]">
      <div className="min-w-25">
        <AspectRatio ratio={3 / 4}>
          <img
            loading="lazy"
            src={imageUrl || "/not-found-photo.png"}
            className="h-full w-full object-contain"
            alt="карточка товара"
          />
        </AspectRatio>
      </div>
      {isMoySkladLinked ? (
        <div
          className="pointer-events-none absolute top-2 left-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 shadow-custom"
          title="Товар из MoySklad"
          aria-label="Товар из MoySklad"
        >
          <MoyskladIcon />
        </div>
      ) : null}
      {actions}
    </CardContent>
  );
};

interface ProductCardHeaderProps {
  description: string;
  isDetailed?: boolean;
  name: string;
  subtitle: string;
}

const ProductCardHeaderSection: React.FC<ProductCardHeaderProps> = ({
  description,
  isDetailed,
  name,
  subtitle,
}) => {
  return (
    <CardHeader className="space-y-2 text-left">
      <CardTitle className={cn("line-clamp-2", isDetailed && "sm:text-lg")}>
        {name}
      </CardTitle>
      <CardSubTitle
        className={cn("line-clamp-1", isDetailed && "sm:text-base")}
      >
        {subtitle}
      </CardSubTitle>
      {isDetailed && (
        <p className={cn("line-clamp-3 text-xs", isDetailed && "sm:text-sm")}>
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
  isDetailed?: boolean;
  isVisiblePrice?: boolean;
  price: number;
}

const ProductCardFooterSection: React.FC<ProductCardFooterProps> = ({
  currency,
  discount,
  displayPrice,
  footerAction,
  hasDiscount,
  isDetailed,
  isVisiblePrice,
  price,
}) => {
  return (
    <CardFooter
      className={cn(
        "relative flex w-full flex-col items-end justify-center",
        isDetailed && "flex-row flex-wrap justify-end gap-x-3 pt-4",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1",
          !isDetailed && "relative -right-2",
        )}
      >
        {hasDiscount && (
          <>
            <p
              className={cn(
                "text-muted text-[10px] font-bold line-through",
                isDetailed && "pl-6 text-sm",
              )}
            >
              {Intl.NumberFormat("ru").format(price)} {currency}
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
      {footerAction ? (
        <div
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          {footerAction}
        </div>
      ) : null}
      <p
        className={cn(
          "text-base font-bold",
          !hasDiscount && "mt-4",
          footerAction && !isVisiblePrice && "hidden",
          displayPrice === undefined && "h-6",
        )}
      >
        {displayPrice !== undefined && (
          <>
            {Intl.NumberFormat("ru").format(displayPrice)}{" "}
            <span className="font-normal">{currency}</span>
          </>
        )}
      </p>
    </CardFooter>
  );
};

const ProductCardBase: React.FC<Props> = ({
  footerAction,
  isMoySkladLinked,
  isDetailed,
  isVisiblePrice,
  className,
  actions,
  data,
}) => {
  const {
    currency,
    description,
    discount,
    displayPrice,
    hasDiscount,
    imageUrl,
    price,
    subtitle,
  } = buildProductCardView(data);
  const resolvedIsMoySkladLinked = isMoySkladLinked ?? isMoySkladProduct(data);

  return (
    <ProductCardLayout className={className} isDetailed={isDetailed}>
      <ProductCardContent
        actions={actions}
        imageUrl={imageUrl}
        isMoySkladLinked={resolvedIsMoySkladLinked}
      />
      <div
        className={cn(
          "flex flex-1 flex-col justify-between p-2 pt-0",
          isDetailed && "pt-2",
        )}
      >
        <ProductCardHeaderSection
          description={description}
          isDetailed={isDetailed}
          name={data.name}
          subtitle={subtitle}
        />
        <ProductCardFooterSection
          currency={currency}
          discount={discount}
          displayPrice={displayPrice}
          footerAction={footerAction}
          hasDiscount={hasDiscount}
          isDetailed={isDetailed}
          isVisiblePrice={isVisiblePrice}
          price={price}
        />
      </div>
    </ProductCardLayout>
  );
};

type ProductCardCompound = React.FC<Props> & {
  Content: typeof ProductCardContent;
  Footer: typeof ProductCardFooterSection;
  Header: typeof ProductCardHeaderSection;
  Layout: typeof ProductCardLayout;
};

export const ProductCard: ProductCardCompound = Object.assign(ProductCardBase, {
  Layout: ProductCardLayout,
  Content: ProductCardContent,
  Header: ProductCardHeaderSection,
  Footer: ProductCardFooterSection,
});
