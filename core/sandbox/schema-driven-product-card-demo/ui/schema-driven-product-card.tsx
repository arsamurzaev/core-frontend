"use client";

import type {
  ProductWithAttributesDto,
  ProductWithDetailsDto,
} from "@/shared/api/generated";
import {
  getAttributeValueByKey,
  type ParsedAttributeValue,
  resolveAttributes,
  toNumberValue,
} from "@/shared/lib/attributes";
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

interface ExtraAttributeConfig {
  key: string;
  label: string;
  fallback?: string;
}

interface Props {
  className?: string;
  data: ProductWithAttributesDto | ProductWithDetailsDto;
  isDetailed?: boolean;
  actions?: React.ReactNode;
  footerAction?: React.ReactNode;
  extraAttribute?: ExtraAttributeConfig;
}

function getVariantAttributePreview(
  data: ProductWithAttributesDto | ProductWithDetailsDto,
  key: string,
): string | null {
  if (!("variants" in data)) {
    return null;
  }

  const values = new Set<string>();

  for (const variant of data.variants ?? []) {
    for (const attribute of variant.attributes ?? []) {
      if (attribute.attribute?.key !== key) {
        continue;
      }

      const value = attribute.enumValue?.displayName ?? attribute.enumValue?.value;
      if (value) {
        values.add(value);
      }
    }
  }

  if (values.size === 0) {
    return null;
  }

  return Array.from(values).join(", ");
}

function getVariantsPreview(
  data: ProductWithAttributesDto | ProductWithDetailsDto,
): string | null {
  if (!("variants" in data)) {
    return null;
  }

  const values = new Set<string>();

  for (const variant of data.variants ?? []) {
    const variantValue = (variant.attributes ?? [])
      .map(
        (attribute) =>
          attribute.enumValue?.displayName ??
          attribute.enumValue?.value ??
          null,
      )
      .filter((value): value is string => Boolean(value))
      .join(" / ");

    if (variantValue) {
      values.add(variantValue);
    }
  }

  if (values.size === 0) {
    return null;
  }

  return Array.from(values).join(", ");
}

function toTextValue(value: ParsedAttributeValue): string | null {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }

  if (typeof value === "boolean") {
    return value ? "Да" : "Нет";
  }

  return null;
}

export const SchemaDrivenProductCard: React.FC<Props> = ({
  footerAction,
  isDetailed,
  className,
  actions,
  data,
  extraAttribute,
}) => {
  const price = toNumberValue(data.price) ?? 0;
  const {
    description = "",
    subtitle = "",
    currency = "RUB",
    discountedPrice,
    discount = 0,
    discountStartAt,
    discountEndAt,
  } = resolveAttributes(data.productAttributes);

  const hasDiscount = isDiscountActive(discountStartAt, discountEndAt);

  const displayPrice = getTotalPrice({
    discountedPrice,
    discountStartAt,
    discountEndAt,
    discount,
    price,
  });
  const imageUrl = data.media?.[0]?.media?.url || "/not-found-photo.png";

  const extraAttributeValue = extraAttribute
    ? toTextValue(
        getAttributeValueByKey(data.productAttributes, extraAttribute.key, null),
      ) ?? getVariantAttributePreview(data, extraAttribute.key)
    : null;
  const variantsPreview = getVariantsPreview(data);
  const showVariantsPreview =
    Boolean(variantsPreview) && variantsPreview !== extraAttributeValue;

  return (
    <Card
      className={cn(
        "relative flex flex-col gap-2 overflow-hidden rounded-lg",
        isDetailed && "flex-row",
        className,
      )}
    >
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
      <div
        className={cn(
          "flex flex-1 flex-col justify-between p-2 pt-0",
          isDetailed && "pt-2",
        )}
      >
        <CardHeader className="space-y-2 text-left">
          <CardTitle className={cn("line-clamp-2", isDetailed && "sm:text-lg")}>
            {data.name}
          </CardTitle>
          <CardSubTitle
            className={cn("line-clamp-1", isDetailed && "sm:text-base")}
          >
            {subtitle}
          </CardSubTitle>
          {extraAttribute && (
            <p className={cn("text-muted text-xs", isDetailed && "sm:text-sm")}>
              <span className="text-foreground font-medium">
                {extraAttribute.label}:
              </span>{" "}
              {extraAttributeValue ?? extraAttribute.fallback ?? "Не указан"}
            </p>
          )}
          {showVariantsPreview && (
            <p className={cn("text-muted text-xs", isDetailed && "sm:text-sm")}>
              <span className="text-foreground font-medium">Вариации:</span>{" "}
              {variantsPreview}
            </p>
          )}
          {isDetailed && (
            <p
              className={cn("line-clamp-3 text-xs", isDetailed && "sm:text-sm")}
            >
              {description}
            </p>
          )}
        </CardHeader>
        <CardFooter
          onClick={(e) => e.stopPropagation()}
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
          {footerAction}
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
      </div>
    </Card>
  );
};
