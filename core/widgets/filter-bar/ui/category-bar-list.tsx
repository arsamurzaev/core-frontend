"use client";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
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
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
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
    if (!activeCategoryId || activeIndex < 0) {
      return;
    }

    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      const container = scrollContainerRef.current;
      const activeItem = itemRefsRef.current.get(activeCategoryId);

      if (!container || !activeItem) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const activeItemRect = activeItem.getBoundingClientRect();
      const scrollPadding = 8;
      const leftOverflow =
        activeItemRect.left - containerRect.left - scrollPadding;
      const rightOverflow =
        activeItemRect.right - containerRect.right + scrollPadding;

      if (leftOverflow < 0) {
        container.scrollTo({
          left: container.scrollLeft + leftOverflow,
          behavior: "auto",
        });
        return;
      }

      if (rightOverflow > 0) {
        container.scrollTo({
          left: container.scrollLeft + rightOverflow,
          behavior: "auto",
        });
      }
    });

    return () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [activeCategoryId, activeIndex]);

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
      ref={scrollContainerRef}
      className={cn(
        "w-full overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      <div className="flex w-max gap-2">
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
                "h-9 w-fit shrink-0 rounded-full px-4 py-2 text-sm",
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
