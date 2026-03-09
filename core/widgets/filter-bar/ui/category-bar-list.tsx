"use client";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/shared/ui/carousel";
import React from "react";

export type CategoryBarItem = {
  id: string;
  name: string;
};

interface Props {
  className?: string;
  items: CategoryBarItem[];
  isLoading?: boolean;
  activeCategoryId?: string | null;
  onCategoryClick?: (item: CategoryBarItem, index: number) => void;
}

export const CategoryBarList: React.FC<Props> = ({
  className,
  items,
  isLoading = false,
  activeCategoryId,
  onCategoryClick,
}) => {
  const [api, setApi] = React.useState<CarouselApi | null>(null);
  const skeletonWidths = React.useMemo(
    () => ["w-16", "w-24", "w-20", "w-28", "w-[4.5rem]", "w-[5.5rem]"],
    [],
  );

  const activeIndex = React.useMemo(
    () => items.findIndex((item) => item.id === activeCategoryId),
    [items, activeCategoryId],
  );

  React.useEffect(() => {
    if (!api || activeIndex < 0) {
      return;
    }

    api.scrollTo(activeIndex);
  }, [activeIndex, api]);

  if (isLoading && items.length === 0) {
    return (
      <div className={cn("w-full overflow-hidden", className)}>
        <div className="flex gap-2">
          {skeletonWidths.map((widthClass, index) => (
            <Skeleton
              key={`category-skeleton-${index}`}
              className={cn("h-9 rounded-full", widthClass)}
            />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <Carousel
      setApi={setApi}
      opts={{
        align: "start",
        dragFree: true,
        containScroll: "trimSnaps",
      }}
      className={cn("w-full", className)}
    >
      <CarouselContent className="-ml-2">
        {items.map((item, index) => {
          const isActive = activeIndex === index;

          return (
            <CarouselItem key={item.id} className="basis-auto pl-2">
              <Button
                type="button"
                variant={isActive ? "default" : "secondary"}
                className="h-9 w-fit rounded-full px-4 py-2 text-sm"
                onClick={() => onCategoryClick?.(item, index)}
              >
                {item.name}
              </Button>
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
};
