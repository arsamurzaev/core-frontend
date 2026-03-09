"use client";

import { ShareDrawer } from "@/core/widgets/share-drawer/ui/share-drawer";
import { useProductControllerGetBySlug } from "@/shared/api/generated";
import type { ProductWithDetailsDto } from "@/shared/api/generated";
import { resolveAttributes, toNumberValue } from "@/shared/lib/attributes";
import { getTotalPrice } from "@/shared/lib/calculate-price";
import { isDiscountActive } from "@/shared/lib/is-discount-active";
import { cn, getCatalogCurrency } from "@/shared/lib/utils";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/shared/ui/carousel";
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
import { CircleHelp, Reply } from "lucide-react";
import React from "react";
import { toast } from "sonner";

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

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function getProductImageUrls(
  product: ProductWithDetailsDto | null | undefined,
): string[] {
  const urls =
    product?.media
      ?.slice()
      .sort((left, right) => left.position - right.position)
      .map((entry) => normalizeText(entry.media?.url))
      .filter((value): value is string => Boolean(value)) ?? [];

  return urls.length > 0 ? urls : ["/not-found-photo.png"];
}

function getVariantsSummary(
  product: ProductWithDetailsDto | null | undefined,
): string | null {
  if (!product) {
    return null;
  }

  const variants = new Set<string>();

  for (const variant of product.variants ?? []) {
    const value = (variant.attributes ?? [])
      .map(
        (attribute) =>
          attribute.enumValue?.displayName ?? attribute.enumValue?.value ?? null,
      )
      .filter((item): item is string => Boolean(item))
      .join(" / ");

    if (value) {
      variants.add(value);
    }
  }

  return variants.size > 0 ? Array.from(variants).join(", ") : null;
}

async function copyToClipboard(value: string): Promise<void> {
  if (!value) {
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();

  const isCopied = document.execCommand("copy");
  document.body.removeChild(textArea);

  if (!isCopied) {
    throw new Error("Не удалось скопировать ссылку");
  }
}

interface ProductDrawerImageCarouselProps {
  imageUrls: string[];
  isLoading: boolean;
  productName: string;
}

const ProductDrawerImageCarousel: React.FC<ProductDrawerImageCarouselProps> = ({
  imageUrls,
  isLoading,
  productName,
}) => {
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (!api) {
      setCurrentIndex(0);
      return;
    }

    const updateCurrentIndex = () => {
      setCurrentIndex(api.selectedScrollSnap());
    };

    updateCurrentIndex();
    api.on("select", updateCurrentIndex);
    api.on("reInit", updateCurrentIndex);

    return () => {
      api.off("select", updateCurrentIndex);
      api.off("reInit", updateCurrentIndex);
    };
  }, [api]);

  React.useEffect(() => {
    setCurrentIndex(0);
  }, [imageUrls]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="aspect-[3/4] w-full rounded-none" />
        <div className="flex justify-center gap-1">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <Carousel
      opts={{ loop: imageUrls.length > 1 }}
      setApi={setApi}
      className="w-full space-y-3"
    >
      <CarouselContent className="-ml-0">
        {imageUrls.map((imageUrl, index) => (
          <CarouselItem key={`${imageUrl}-${index}`} className="pl-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              loading="lazy"
              src={imageUrl}
              alt={productName}
              className="aspect-[3/4] w-full object-contain"
            />
          </CarouselItem>
        ))}
      </CarouselContent>

      {imageUrls.length > 1 ? (
        <ul className="flex justify-center gap-1 px-4 pb-1">
          {imageUrls.map((_, index) => (
            <li
              key={index}
              className={cn(
                "bg-secondary h-2 w-2 rounded-full transition-colors",
                currentIndex === index && "bg-primary",
              )}
            />
          ))}
        </ul>
      ) : null}
    </Carousel>
  );
};

interface ProductDrawerNativeShareButtonProps {
  title: string;
  text?: string;
}

const ProductDrawerNativeShareButton: React.FC<
  ProductDrawerNativeShareButtonProps
> = ({ title, text }) => {
  const handleShare = React.useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";

    if (!url) {
      return;
    }

    const shareData: ShareData = {
      title,
      text,
      url,
    };

    try {
      if (
        typeof navigator.share === "function" &&
        (typeof navigator.canShare !== "function" || navigator.canShare(shareData))
      ) {
        await navigator.share(shareData);
        return;
      }

      await copyToClipboard(url);
      toast.success("Ссылка на товар скопирована");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      try {
        await copyToClipboard(url);
        toast.success("Ссылка на товар скопирована");
      } catch {
        toast.error("Не удалось поделиться товаром");
      }
    }
  }, [text, title]);

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="shadow-custom opacity-70"
      onClick={handleShare}
      aria-label="Поделиться товаром"
    >
      <Reply className="size-5" />
    </Button>
  );
};

export const ProductDrawer: React.FC<ProductDrawerProps> = ({
  open,
  productSlug,
  initialProduct,
  className,
  onOpenChange,
  onAfterClose,
}) => {
  const { catalog } = useCatalogState();
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
  const imageUrls = React.useMemo(() => getProductImageUrls(data), [data]);
  const variantsSummary = React.useMemo(() => getVariantsSummary(data), [data]);
  const hasError = isError || (!isLoading && !data);

  const subtitle = typeof attrs.subtitle === "string" ? attrs.subtitle : "";
  const description =
    typeof attrs.description === "string" ? attrs.description : "";
  const currency =
    normalizeText(attrs.currency) ?? getCatalogCurrency(catalog, "RUB");

  const discount = toNumberValue(attrs.discount ?? null) ?? 0;
  const discountedPrice =
    toNumberValue(attrs.discountedPrice ?? null) ?? undefined;
  const discountStartAt = parseDate(attrs.discountStartAt);
  const discountEndAt = parseDate(attrs.discountEndAt);

  const price = toNumberValue(data?.price ?? null) ?? 0;
  const isDiscountEnabled = isDiscountActive(discountStartAt, discountEndAt);
  const displayPrice = getTotalPrice({
    price,
    discountedPrice,
    discount,
    discountStartAt,
    discountEndAt,
  });
  const hasDiscount = displayPrice < price && isDiscountEnabled;

  const brandName = normalizeText(data?.brand?.name);
  const displayName = data?.name ?? "Товар";
  const shareText = subtitle || description || undefined;
  const didOpenOnceRef = React.useRef(open);
  const didNotifyCloseRef = React.useRef(false);

  React.useEffect(() => {
    if (!open) return;
    didOpenOnceRef.current = true;
    didNotifyCloseRef.current = false;
  }, [open, productSlug]);

  const emitAfterCloseOnce = React.useCallback(() => {
    if (!didOpenOnceRef.current) return;
    if (didNotifyCloseRef.current) return;

    didNotifyCloseRef.current = true;
    onAfterClose?.();
  }, [onAfterClose]);

  React.useEffect(() => {
    if (open) return;
    if (!onAfterClose) return;

    const fallbackTimer = window.setTimeout(() => {
      emitAfterCloseOnce();
    }, 260);

    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, [emitAfterCloseOnce, onAfterClose, open]);

  const handleCloseAnimationEnd = React.useCallback(
    (
      event:
        | React.AnimationEvent<HTMLDivElement>
        | React.TransitionEvent<HTMLDivElement>,
    ) => {
      if (event.target !== event.currentTarget) return;
      if (open) return;
      if (event.currentTarget.getAttribute("data-state") !== "closed") return;

      emitAfterCloseOnce();
    },
    [emitAfterCloseOnce, open],
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
        className={cn(
          "mx-auto w-full max-w-[30rem] rounded-t-2xl border bg-background shadow-custom",
          className,
        )}
      >
        <DrawerTitle className="sr-only">{displayName}</DrawerTitle>

        <div className="flex min-h-0 flex-1 flex-col">
          <DrawerScrollArea>
            <DrawerHeader className="overflow-visible px-0 pb-4">
              <div className="relative">
                <span className="sr-only">carousel</span>
                <ProductDrawerImageCarousel
                  key={productSlug}
                  imageUrls={imageUrls}
                  isLoading={isLoading}
                  productName={displayName}
                />

                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  <ShareDrawer
                    mode="share"
                    title={displayName}
                    text={shareText}
                    trigger={
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="shadow-custom opacity-70"
                        aria-label="Открыть способы отправки"
                      >
                        <CircleHelp className="size-5" />
                      </Button>
                    }
                  />
                  <ProductDrawerNativeShareButton
                    title={displayName}
                    text={shareText}
                  />
                </div>
              </div>

              <div className="space-y-2 px-4 text-left">
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-2/3" />
                    <Skeleton className="h-5 w-1/2" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </>
                ) : (
                  <>
                    <DrawerTitle className="text-2xl font-bold sm:text-3xl">
                      {displayName}
                    </DrawerTitle>
                    {subtitle ? (
                      <DrawerDescription className="text-left text-base font-light text-foreground sm:text-lg">
                        {subtitle}
                      </DrawerDescription>
                    ) : null}
                    {description ? (
                      <p className="text-xs break-words whitespace-pre-wrap sm:text-base">
                        {description}
                      </p>
                    ) : null}
                  </>
                )}

                {hasError ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    Не удалось загрузить товар. Попробуйте снова.
                  </div>
                ) : null}
              </div>
            </DrawerHeader>

            {isLoading ? (
              <div className="space-y-2 px-4 pb-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : brandName || variantsSummary ? (
              <div className="space-y-1 px-4 pb-4 text-left">
                {brandName ? (
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    <span className="text-foreground font-medium">Бренд:</span>{" "}
                    {brandName}
                  </p>
                ) : null}
                {variantsSummary ? (
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    <span className="text-foreground font-medium">
                      Вариации:
                    </span>{" "}
                    {variantsSummary}
                  </p>
                ) : null}
              </div>
            ) : null}
          </DrawerScrollArea>

          <DrawerFooter className="shadow-custom relative mx-2 flex min-h-[84px] flex-row items-center justify-between rounded-t-2xl px-6 py-0">
            {isLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-7 w-28" />
              </div>
            ) : (
              <div className="flex gap-4">
                {hasDiscount ? (
                  <div className="text-muted-foreground relative text-xl line-through">
                    {discount > 0 ? (
                      <Badge className="absolute top-3 left-0">
                        -{discount}%
                      </Badge>
                    ) : null}
                    <span className="font-bold">{formatPrice(price)}</span>{" "}
                    {currency}
                  </div>
                ) : null}

                <div className={cn("text-xl", !displayPrice && "hidden")}>
                  <span className="font-bold">
                    {formatPrice(displayPrice)}
                  </span>{" "}
                  {currency}
                </div>
              </div>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
