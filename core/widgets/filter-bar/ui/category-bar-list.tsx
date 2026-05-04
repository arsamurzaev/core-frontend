"use client";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import useEmblaCarousel from "embla-carousel-react";
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
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });
  const itemRefsRef = React.useRef(new Map<string, HTMLButtonElement>());
  const scrollFrameRef = React.useRef<number | null>(null);
  const skeletonWidths = React.useMemo(
    () => ["w-16", "w-24", "w-20", "w-28", "w-[4.5rem]", "w-[5.5rem]"],
    [],
  );

  const activeIndex = React.useMemo(
    () => items.findIndex((item) => item.id === activeCategoryId),
    [items, activeCategoryId],
  );

  React.useEffect(() => {
    if (!emblaApi || items.length === 0) {
      return;
    }

    emblaApi.reInit();
  }, [emblaApi, items.length]);

  React.useEffect(() => {
    if (!emblaApi || !activeCategoryId || activeIndex < 0) {
      return;
    }

    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;

      emblaApi.scrollTo(activeIndex);
    });

    return () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [activeCategoryId, activeIndex, emblaApi]);

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
    <div
      ref={emblaRef}
      className={cn(
        "w-full cursor-grab overflow-hidden active:cursor-grabbing",
        className,
      )}
    >
      <div className="flex touch-pan-y gap-2 [touch-action:pan-y_pinch-zoom]">
        {items.map((item, index) => {
          const isActive = activeIndex === index;

          return (
            <Button
              key={item.id}
              type="button"
              ref={(node) => {
                if (node) {
                  itemRefsRef.current.set(item.id, node);
                  return;
                }

                itemRefsRef.current.delete(item.id);
              }}
              variant={isActive ? "default" : "secondary"}
              aria-current={isActive ? "true" : undefined}
              onClick={() => onCategoryClick?.(item, index)}
              className={cn(
                "h-9 min-w-0 shrink-0 grow-0 basis-auto rounded-full px-4 py-2 text-sm",
              )}
            >
              {item.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
