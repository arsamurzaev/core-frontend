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
  const scrollTimeoutRef = React.useRef<number | null>(null);
  const pointerStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const hasPointerDraggedRef = React.useRef(false);
  const suppressNextClickRef = React.useRef(false);
  const clickedCategoryIdRef = React.useRef<string | null>(null);
  const suppressClickedCategoryScrollUntilRef = React.useRef(0);
  const userInteractionUntilRef = React.useRef(0);
  const skeletonWidths = React.useMemo(
    () => ["w-16", "w-24", "w-20", "w-28", "w-[4.5rem]", "w-[5.5rem]"],
    [],
  );

  const activeIndex = React.useMemo(
    () => items.findIndex((item) => item.id === activeCategoryId),
    [items, activeCategoryId],
  );

  const cancelScheduledActiveScroll = React.useCallback(() => {
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    }

    if (scrollTimeoutRef.current !== null) {
      window.clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  }, []);

  const shouldJumpCategoryBarScroll = React.useCallback(() => {
    return (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  const scrollCategoryBarToIndex = React.useCallback(
    (index: number) => {
      if (!emblaApi || index < 0) {
        return;
      }

      emblaApi.scrollTo(Math.max(index - 1, 0), shouldJumpCategoryBarScroll());
    },
    [emblaApi, shouldJumpCategoryBarScroll],
  );

  React.useEffect(() => {
    if (!emblaApi || items.length === 0) {
      return;
    }

    emblaApi.reInit();
  }, [emblaApi, items.length]);

  const scheduleActiveCategoryScroll = React.useCallback(() => {
    if (!emblaApi || activeIndex < 0) {
      return;
    }

    cancelScheduledActiveScroll();

    if (
      activeCategoryId &&
      clickedCategoryIdRef.current === activeCategoryId &&
      Date.now() < suppressClickedCategoryScrollUntilRef.current
    ) {
      return;
    }

    const runWhenInteractionSettles = () => {
      scrollTimeoutRef.current = null;
      const remainingInteractionMs =
        userInteractionUntilRef.current - Date.now();

      if (remainingInteractionMs > 0) {
        scrollTimeoutRef.current = window.setTimeout(
          runWhenInteractionSettles,
          remainingInteractionMs,
        );
        return;
      }

      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        scrollCategoryBarToIndex(activeIndex);
      });
    };

    runWhenInteractionSettles();
  }, [
    activeCategoryId,
    activeIndex,
    cancelScheduledActiveScroll,
    emblaApi,
    scrollCategoryBarToIndex,
  ]);

  React.useEffect(() => {
    if (!emblaApi || !activeCategoryId || activeIndex < 0) {
      cancelScheduledActiveScroll();
      return;
    }

    scheduleActiveCategoryScroll();

    return cancelScheduledActiveScroll;
  }, [
    activeCategoryId,
    activeIndex,
    cancelScheduledActiveScroll,
    emblaApi,
    scheduleActiveCategoryScroll,
  ]);

  const blockActiveScrollAfterDrag = React.useCallback((durationMs: number) => {
    userInteractionUntilRef.current = Date.now() + durationMs;
  }, []);

  React.useEffect(() => {
    return () => {
      cancelScheduledActiveScroll();
    };
  }, [cancelScheduledActiveScroll]);

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      cancelScheduledActiveScroll();

      pointerStartRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
      hasPointerDraggedRef.current = false;
      suppressNextClickRef.current = false;
    },
    [cancelScheduledActiveScroll],
  );

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const start = pointerStartRef.current;

      if (!start) {
        return;
      }

      const deltaX = Math.abs(event.clientX - start.x);
      const deltaY = Math.abs(event.clientY - start.y);

      if (deltaX > 6 || deltaY > 6) {
        blockActiveScrollAfterDrag(700);
        hasPointerDraggedRef.current = true;
        suppressNextClickRef.current = true;
      }
    },
    [blockActiveScrollAfterDrag],
  );

  const handlePointerEnd = React.useCallback(() => {
    if (hasPointerDraggedRef.current) {
      blockActiveScrollAfterDrag(350);
    }

    pointerStartRef.current = null;
    hasPointerDraggedRef.current = false;
  }, [blockActiveScrollAfterDrag]);

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
      <div className="flex touch-pan-y gap-2 pr-4 [touch-action:pan-y_pinch-zoom]">
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
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerCancel={handlePointerEnd}
              onPointerUp={handlePointerEnd}
              onClick={() => {
                if (suppressNextClickRef.current) {
                  suppressNextClickRef.current = false;
                  return;
                }

                clickedCategoryIdRef.current = item.id;
                suppressClickedCategoryScrollUntilRef.current =
                  Date.now() + 700;
                cancelScheduledActiveScroll();
                scrollCategoryBarToIndex(index);
                onCategoryClick?.(item, index);
              }}
              className={cn(
                "h-9 min-w-0 shrink-0 grow-0 basis-auto rounded-full px-4 py-2 text-sm duration-200 ease-out",
                !isActive && "shadow-none",
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
