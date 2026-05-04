"use client";

import { cn } from "@/shared/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/shared/ui/carousel";
import { Skeleton } from "@/shared/ui/skeleton";
import React from "react";

interface ProductDrawerImageCarouselProps {
  imageUrls: string[];
  isLoading: boolean;
  productName: string;
}

function getImageUrlsSignature(imageUrls: string[]): string {
  return imageUrls.join("\u0000");
}

export function ProductDrawerImageCarousel({
  imageUrls,
  isLoading,
  productName,
}: ProductDrawerImageCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [visibleImageUrls, setVisibleImageUrls] = React.useState(imageUrls);
  const incomingImageUrlsSignature = getImageUrlsSignature(imageUrls);
  const visibleImageUrlsSignature = getImageUrlsSignature(visibleImageUrls);

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
    if (incomingImageUrlsSignature === visibleImageUrlsSignature) {
      return;
    }

    let isCancelled = false;
    const nextPrimaryImageUrl = imageUrls[0];
    setCurrentIndex(0);
    api?.scrollTo(0, true);

    if (!nextPrimaryImageUrl || typeof window === "undefined") {
      setVisibleImageUrls(imageUrls);
      return;
    }

    const preloadImage = new window.Image();
    const showIncomingImages = () => {
      if (!isCancelled) {
        setVisibleImageUrls(imageUrls);
      }
    };

    preloadImage.decoding = "async";

    if (preloadImage.decode) {
      preloadImage.src = nextPrimaryImageUrl;
      preloadImage.decode().then(showIncomingImages, showIncomingImages);
    } else {
      preloadImage.onload = showIncomingImages;
      preloadImage.onerror = showIncomingImages;
      preloadImage.src = nextPrimaryImageUrl;

      if (preloadImage.complete) {
        showIncomingImages();
      }
    }

    return () => {
      isCancelled = true;
    };
  }, [
    api,
    imageUrls,
    incomingImageUrlsSignature,
    visibleImageUrlsSignature,
  ]);

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
      opts={{ loop: visibleImageUrls.length > 1 }}
      setApi={setApi}
      className="w-full space-y-3"
    >
      <CarouselContent className="-ml-0">
        {visibleImageUrls.map((imageUrl, index) => (
          <CarouselItem key={`${imageUrl}-${index}`} className="pl-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              src={imageUrl}
              alt={productName}
              decoding="async"
              className="aspect-[3/4] w-full object-contain"
            />
          </CarouselItem>
        ))}
      </CarouselContent>

      <ul className="flex justify-center min-h-2 gap-1 px-4 pb-1">
        {visibleImageUrls.map((_, index) => (
          <li
            key={index}
            className={cn(
              "bg-secondary size-2 rounded-full transition-colors",
              currentIndex === index && "bg-primary",
            )}
          />
        ))}
      </ul>
    </Carousel>
  );
}
