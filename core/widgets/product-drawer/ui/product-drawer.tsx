"use client";

import { useProductControllerGetBySlug } from "@/shared/api/generated";
import type { ProductWithDetailsDto } from "@/shared/api/generated";
import { resolveAttributes, toNumberValue } from "@/shared/lib/attributes";
import { getTotalPrice } from "@/shared/lib/calculate-price";
import { isDiscountActive } from "@/shared/lib/is-discount-active";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerScrollArea,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { Skeleton } from "@/shared/ui/skeleton";
import { X } from "lucide-react";
import React from "react";

interface ProductDrawerProps {
  open: boolean;
  productSlug: string;
  initialProduct?: ProductWithDetailsDto | null;
  className?: string;
  onOpenChange: (open: boolean) => void;
  onAfterClose?: () => void;
}

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== "string") return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatPrice(value: number): string {
  return Intl.NumberFormat("ru-RU").format(value);
}

export const ProductDrawer: React.FC<ProductDrawerProps> = ({
  open,
  productSlug,
  initialProduct,
  className,
  onOpenChange,
  onAfterClose,
}) => {
  const { data, isLoading, isError } = useProductControllerGetBySlug(
    productSlug,
    {
      query: {
        enabled: Boolean(productSlug),
        initialData: initialProduct ?? undefined,
        staleTime: 30_000,
      },
    },
  );

  const attrs = React.useMemo(
    () => resolveAttributes(data?.productAttributes),
    [data?.productAttributes],
  );
  const hasError = isError || (!isLoading && !data);

  const subtitle = typeof attrs.subtitle === "string" ? attrs.subtitle : "";
  const description =
    typeof attrs.description === "string" ? attrs.description : "";
  const currency = typeof attrs.currency === "string" ? attrs.currency : "RUB";

  const discount = toNumberValue(attrs.discount ?? null) ?? 0;
  const discountedPrice =
    toNumberValue(attrs.discountedPrice ?? null) ?? undefined;
  const discountStartAt = parseDate(attrs.discountStartAt);
  const discountEndAt = parseDate(attrs.discountEndAt);

  const price = toNumberValue(data?.price ?? null) ?? 0;
  const hasDiscount = isDiscountActive(discountStartAt, discountEndAt);
  const displayPrice = getTotalPrice({
    price,
    discountedPrice,
    discount,
    discountStartAt,
    discountEndAt,
  });

  const imageUrl = data?.media?.[0]?.media?.url || "/not-found-photo.png";
  const displayName = data?.name ?? "Товар";
  const variantsCount = data?.variants?.length ?? 0;
  const wasOpenedRef = React.useRef(false);
  const afterCloseFiredRef = React.useRef(false);

  React.useEffect(() => {
    if (!open) return;
    wasOpenedRef.current = true;
    afterCloseFiredRef.current = false;
  }, [open]);

  const handleCloseAnimationEnd = React.useCallback(
    (
      event:
        | React.AnimationEvent<HTMLDivElement>
        | React.TransitionEvent<HTMLDivElement>,
    ) => {
      if (event.target !== event.currentTarget) return;
      if (!wasOpenedRef.current) return;
      if (open) return;

      const state = event.currentTarget.getAttribute("data-state");
      if (state && state !== "closed") return;
      if (afterCloseFiredRef.current) return;

      afterCloseFiredRef.current = true;
      onAfterClose?.();
    },
    [open, onAfterClose],
  );

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      dismissible
    >
      <DrawerContent
        onAnimationEnd={handleCloseAnimationEnd}
        onTransitionEnd={handleCloseAnimationEnd}
        className={cn("mx-auto w-full max-w-xl", className)}
      >
        <DrawerTitle className="sr-only">{displayName}</DrawerTitle>

        <div className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader className="space-y-0 p-0">
            <div className="relative overflow-hidden rounded-t-xl">
              {isLoading ? (
                <Skeleton className="h-[38dvh] min-h-[240px] w-full rounded-none" />
              ) : (
                <img
                  src={imageUrl}
                  alt={displayName}
                  className="h-[38dvh] min-h-[240px] w-full object-cover"
                />
              )}

              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-4 right-4 shadow-sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </DrawerHeader>

          <DrawerScrollArea className="px-4 py-4">
            <div className="space-y-3">
              {hasError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  Не удалось загрузить товар. Попробуйте снова.
                </div>
              ) : null}

              {isLoading ? (
                <Skeleton className="h-8 w-2/3" />
              ) : (
                <DrawerTitle className="text-2xl">{displayName}</DrawerTitle>
              )}

              {isLoading ? (
                <Skeleton className="h-5 w-1/2" />
              ) : subtitle ? (
                <DrawerDescription className="text-base text-black/70">
                  {subtitle}
                </DrawerDescription>
              ) : null}

              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : description ? (
                <p className="text-sm leading-relaxed whitespace-pre-line text-black/80">
                  {description}
                </p>
              ) : null}

              {isLoading ? (
                <Skeleton className="h-4 w-28" />
              ) : variantsCount > 0 ? (
                <p className="text-muted-foreground text-sm">
                  Вариантов: {variantsCount}
                </p>
              ) : null}
            </div>
          </DrawerScrollArea>

          <DrawerFooter className="border-t pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <Skeleton className="h-5 w-14" />
                ) : hasDiscount && discount > 0 ? (
                  <Badge className="text-xs">-{discount}%</Badge>
                ) : null}

                {isLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : hasDiscount ? (
                  <p className="text-muted-foreground text-sm line-through">
                    {formatPrice(price)} {currency}
                  </p>
                ) : null}
              </div>

              {isLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <p className="text-xl font-bold">
                  {formatPrice(displayPrice)}{" "}
                  <span className="text-sm font-normal">{currency}</span>
                </p>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Закрыть
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};