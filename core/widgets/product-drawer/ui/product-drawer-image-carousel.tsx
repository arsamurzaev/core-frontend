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

export function ProductDrawerImageCarousel({
  imageUrls,
  isLoading,
  productName,
}: ProductDrawerImageCarouselProps) {
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
}
