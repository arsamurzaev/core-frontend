"use client";

import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
  }
}

interface YandexMetrikaPageviewProps {
  counterIds: number[];
}

export function YandexMetrikaPageview({
  counterIds,
}: YandexMetrikaPageviewProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousUrlRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const queryString = searchParams.toString();
    const url = `${pathname}${queryString ? `?${queryString}` : ""}`;

    if (previousUrlRef.current === null) {
      previousUrlRef.current = url;
      return;
    }

    if (previousUrlRef.current === url || typeof window.ym !== "function") {
      previousUrlRef.current = url;
      return;
    }

    previousUrlRef.current = url;
    counterIds.forEach((counterId) => {
      window.ym?.(counterId, "hit", url);
    });
  }, [counterIds, pathname, searchParams]);

  return null;
}
