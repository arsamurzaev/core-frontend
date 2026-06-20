"use client";

import { cn } from "@/shared/lib/utils";
import React from "react";

interface ProductDomBudgetContentProps {
  children: React.ReactNode;
  className?: string;
  enabled: boolean;
  estimatedHeight?: number;
  forceRender?: boolean;
  rootMargin?: string;
}

const DEFAULT_ROOT_MARGIN = "1800px 0px";

function normalizeEstimatedHeight(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.ceil(value));
}

export const ProductDomBudgetContent: React.FC<
  ProductDomBudgetContentProps
> = ({
  children,
  className,
  enabled,
  estimatedHeight,
  forceRender = false,
  rootMargin = DEFAULT_ROOT_MARGIN,
}) => {
  const normalizedEstimatedHeight = normalizeEstimatedHeight(estimatedHeight);
  const [element, setElement] = React.useState<HTMLDivElement | null>(null);
  const [isNearViewport, setIsNearViewport] = React.useState(!enabled);
  const [measuredHeight, setMeasuredHeight] = React.useState(
    normalizedEstimatedHeight,
  );
  const shouldRender =
    !enabled || forceRender || isNearViewport || measuredHeight <= 0;

  const measure = React.useCallback(() => {
    if (!element || !shouldRender) {
      return;
    }

    const nextHeight = Math.ceil(
      Math.max(element.getBoundingClientRect().height, element.scrollHeight),
    );

    setMeasuredHeight((previousHeight) =>
      Math.abs(previousHeight - nextHeight) <= 1 ? previousHeight : nextHeight,
    );
  }, [element, shouldRender]);

  React.useLayoutEffect(() => {
    if (!enabled || forceRender || isNearViewport) {
      return;
    }

    setMeasuredHeight((previousHeight) =>
      previousHeight > 0 ? previousHeight : normalizedEstimatedHeight,
    );
  }, [enabled, forceRender, isNearViewport, normalizedEstimatedHeight]);

  React.useEffect(() => {
    if (!enabled) {
      setIsNearViewport(true);
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setIsNearViewport(true);
      return;
    }

    if (!element) {
      setIsNearViewport(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNearViewport(Boolean(entry?.isIntersecting));
      },
      { rootMargin },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, enabled, rootMargin]);

  React.useLayoutEffect(() => {
    measure();
  }, [children, measure]);

  React.useEffect(() => {
    if (!element || !shouldRender || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, measure, shouldRender]);

  return (
    <div
      ref={setElement}
      className={cn(className)}
      style={shouldRender ? undefined : { height: measuredHeight }}
      aria-hidden={shouldRender ? undefined : true}
    >
      {shouldRender ? children : null}
    </div>
  );
};
