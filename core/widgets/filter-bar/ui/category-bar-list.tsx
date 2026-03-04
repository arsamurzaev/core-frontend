"use client";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
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
  activeCategoryId?: string | null;
  onCategoryClick?: (item: CategoryBarItem, index: number) => void;
}

export const CategoryBarList: React.FC<Props> = ({
  className,
  items,
  activeCategoryId,
  onCategoryClick,
}) => {
  const [api, setApi] = React.useState<CarouselApi | null>(null);

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

