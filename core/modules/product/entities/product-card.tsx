import { ProductWithAttributesDto } from "@/shared/api/generated";
import { resolveAttributes, toNumberValue } from "@/shared/lib/attributes";
import { getTotalPrice } from "@/shared/lib/calculate-price";
import { isDiscountActive } from "@/shared/lib/is-discount-active";
import { cn } from "@/shared/lib/utils";
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
import React from "react";

interface Props {
  className?: string;
  data: ProductWithAttributesDto;
  isDetailed?: boolean;
  actions?: React.ReactNode;
  footerAction?: React.ReactNode;
}

interface ProductCardLayoutProps {
  className?: string;
  isDetailed?: boolean;
  children: React.ReactNode;
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
  isDetailed?: boolean;
}

const ProductCardContent: React.FC<ProductCardContentProps> = ({
  actions,
  imageUrl,
  isDetailed,
}) => {
  return (
    <CardContent className={cn("flex-[0_1_160px]", isDetailed && "relative")}>
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
  discount: number | undefined;
  displayPrice: ReturnType<typeof getTotalPrice>;
  footerAction?: React.ReactNode;
  hasDiscount: boolean;
  isDetailed?: boolean;
  price: number;
}

const ProductCardFooterSection: React.FC<ProductCardFooterProps> = ({
  currency,
  discount,
  displayPrice,
  footerAction,
  hasDiscount,
  isDetailed,
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
          footerAction && "hidden",
          !Boolean(displayPrice) && "h-6",
        )}
      >
        {Boolean(displayPrice) && (
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
  isDetailed,
  className,
  actions,
  data,
}) => {
  const price = toNumberValue(data.price) ?? 0;
  const {
    description = "",
    subtitle = "",
    currency = "RUB",
    discountedPrice,
    discount = undefined,
    discountStartAt,
    discountEndAt,
  } = resolveAttributes(data.productAttributes);

  const hasDiscount =
    isDiscountActive(discountStartAt, discountEndAt) && Boolean(discount);

  const displayPrice = getTotalPrice({
    discountedPrice,
    discountStartAt,
    discountEndAt,
    discount,
    price,
  });
  const imageUrl = data.media?.[0]?.media?.url || "/not-found-photo.png";

  return (
    <ProductCardLayout className={className} isDetailed={isDetailed}>
      <ProductCardContent
        actions={actions}
        imageUrl={imageUrl}
        isDetailed={isDetailed}
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
          price={price}
        />
      </div>
    </ProductCardLayout>
  );
};

type ProductCardCompound = React.FC<Props> & {
  Layout: typeof ProductCardLayout;
  Content: typeof ProductCardContent;
  Header: typeof ProductCardHeaderSection;
  Footer: typeof ProductCardFooterSection;
};

export const ProductCard: ProductCardCompound = Object.assign(ProductCardBase, {
  Layout: ProductCardLayout,
  Content: ProductCardContent,
  Header: ProductCardHeaderSection,
  Footer: ProductCardFooterSection,
});
