"use client";

import { useProductControllerGetById } from "@/shared/api/generated";
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
import { Loader2, X } from "lucide-react";
import React from "react";

interface ProductDrawerProps {
  open: boolean;
  productId: string;
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
  return Intl.NumberFormat("ru").format(value);
}

export const ProductDrawer: React.FC<ProductDrawerProps> = ({
  open,
  productId,
  className,
  onOpenChange,
  onAfterClose,
}) => {
  const { data, isLoading, isError } = useProductControllerGetById(productId);
  const afterCloseFiredRef = React.useRef(false);

  React.useEffect(() => {
    if (open) {
      afterCloseFiredRef.current = false;
    }
  }, [open]);

  const handleCloseAnimationEnd = React.useCallback(
    (
      event:
        | React.AnimationEvent<HTMLDivElement>
        | React.TransitionEvent<HTMLDivElement>,
    ) => {
      if (event.target !== event.currentTarget) return;
      if (open) return;
      const state = event.currentTarget.getAttribute("data-state");
      if (state && state !== "closed") return;
      if (afterCloseFiredRef.current) return;
      afterCloseFiredRef.current = true;
      onAfterClose?.();
    },
    [open, onAfterClose],
  );

  const attrs = React.useMemo(
    () => resolveAttributes(data?.productAttributes),
    [data?.productAttributes],
  );

  const subtitle = typeof attrs.subtitle === "string" ? attrs.subtitle : "";
  const description =
    typeof attrs.description === "string" ? attrs.description : "";
  const currency = typeof attrs.currency === "string" ? attrs.currency : "RUB";

  const discount = toNumberValue(attrs.discount) ?? 0;
  const discountedPrice = toNumberValue(attrs.discountedPrice) ?? undefined;
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange} dismissible>
      <DrawerContent
        onAnimationEnd={handleCloseAnimationEnd}
        onTransitionEnd={handleCloseAnimationEnd}
        className={cn("mx-auto w-full max-w-xl", className)}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {isLoading ? (
            <div className="flex min-h-[50dvh] items-center justify-center">
              <Loader2 className="text-muted-foreground size-8 animate-spin" />
            </div>
          ) : isError || !data ? (
            <>
              <DrawerHeader className="items-center space-y-2">
                <DrawerTitle>Не удалось загрузить товар</DrawerTitle>
                <DrawerDescription>
                  Попробуйте снова или откройте другой товар.
                </DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Закрыть
                </Button>
              </DrawerFooter>
            </>
          ) : (
            <>
              <DrawerHeader className="space-y-0 p-0">
                <div className="relative overflow-hidden rounded-t-xl">
                  <img
                    src={imageUrl}
                    alt={data.name}
                    className="h-[38dvh] min-h-[240px] w-full object-cover"
                  />
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
                  <DrawerTitle className="text-2xl">{data.name}</DrawerTitle>
                  {subtitle && (
                    <DrawerDescription className="text-base text-black/70">
                      {subtitle}
                    </DrawerDescription>
                  )}
                  {description && (
                    <p className="text-sm leading-relaxed whitespace-pre-line text-black/80">
                      {description}
                    </p>
                  )}

                  {data.variants.length > 0 && (
                    <p className="text-muted-foreground text-sm">
                      Вариантов: {data.variants.length}
                    </p>
                  )}
                </div>
              </DrawerScrollArea>

              <DrawerFooter className="border-t pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {hasDiscount && discount > 0 && (
                      <Badge className="text-xs">-{discount}%</Badge>
                    )}
                    {hasDiscount && (
                      <p className="text-muted-foreground text-sm line-through">
                        {formatPrice(price)} {currency}
                      </p>
                    )}
                  </div>

                  <p className="text-xl font-bold">
                    {formatPrice(displayPrice)}{" "}
                    <span className="text-sm font-normal">{currency}</span>
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Закрыть
                </Button>
              </DrawerFooter>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
