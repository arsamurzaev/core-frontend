"use client";

import { Button } from "@/shared/ui/button";
import Script from "next/script";
import React from "react";
import { YandexMetrikaPageview } from "./yandex-metrika-pageview";

const YANDEX_METRIKA_NOTICE_COOKIE_NAME =
  "catalog_yandex_metrika_notice_dismissed";
const YANDEX_METRIKA_NOTICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

interface YandexMetrikaProps {
  counterIds?: Array<string | null | undefined> | null;
}

function readYandexMetrikaNoticeDismissed() {
  try {
    return document.cookie
      .split(";")
      .map((part) => part.trim())
      .some((part) => part === `${YANDEX_METRIKA_NOTICE_COOKIE_NAME}=1`);
  } catch {
    return false;
  }
}

function writeYandexMetrikaNoticeDismissed() {
  try {
    document.cookie = [
      `${YANDEX_METRIKA_NOTICE_COOKIE_NAME}=1`,
      `max-age=${YANDEX_METRIKA_NOTICE_COOKIE_MAX_AGE}`,
      "path=/",
      "samesite=lax",
    ].join("; ");
  } catch {
    // The banner will reappear if cookies are unavailable.
  }
}

function normalizeCounterId(counterId: string | null | undefined) {
  const value = String(counterId ?? "").trim();

  if (!/^\d+$/.test(value)) {
    return null;
  }

  const numericValue = Number(value);

  return Number.isSafeInteger(numericValue) && numericValue > 0
    ? numericValue
    : null;
}

function normalizeCounterIds(
  counterIds: Array<string | null | undefined> | null | undefined,
) {
  const seen = new Set<number>();
  const normalizedIds: number[] = [];

  counterIds?.forEach((counterId) => {
    const value = normalizeCounterId(counterId);

    if (!value || seen.has(value)) {
      return;
    }

    seen.add(value);
    normalizedIds.push(value);
  });

  return normalizedIds;
}

function buildYandexMetrikaSnippet(counterId: number) {
  const counterIdJson = JSON.stringify(counterId);
  const tagUrlJson = JSON.stringify(
    `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`,
  );

  return `
    (function(m,e,t,r,i,k,a){
      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (var j = 0; j < document.scripts.length; j++) {
        if (document.scripts[j].src === r) { return; }
      }
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script',${tagUrlJson}, 'ym');

    window.dataLayer = window.dataLayer || [];
    ym(${counterIdJson}, 'init', {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: "dataLayer",
      referrer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true
    });
  `;
}

function YandexMetrikaNoticeBanner({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  return (
    <div
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-lg rounded-lg border bg-background/95 p-3 shadow-custom backdrop-blur"
      role="status"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="text-foreground flex-1 text-xs leading-5">
          Используем cookie для стабильной работы сайта и аналитики.
        </p>
        <Button
          className="h-9 shrink-0 px-4 text-xs"
          type="button"
          onClick={onDismiss}
        >
          Ок
        </Button>
      </div>
    </div>
  );
}

export const YandexMetrika: React.FC<YandexMetrikaProps> = ({
  counterIds,
}) => {
  const normalizedCounterIds = normalizeCounterIds(counterIds);
  const [isNoticeDismissed, setIsNoticeDismissed] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsNoticeDismissed(readYandexMetrikaNoticeDismissed());
    setIsHydrated(true);
  }, []);

  const handleNoticeDismiss = React.useCallback(() => {
    writeYandexMetrikaNoticeDismissed();
    setIsNoticeDismissed(true);
  }, []);

  if (normalizedCounterIds.length === 0) {
    return null;
  }

  return (
    <>
      {normalizedCounterIds.map((counterId) => (
        <Script
          key={counterId}
          id={`yandex-metrika-${counterId}`}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: buildYandexMetrikaSnippet(counterId),
          }}
        />
      ))}
      <noscript>
        {normalizedCounterIds.map((counterId) => (
          <div key={counterId}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://mc.yandex.ru/watch/${counterId}`}
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        ))}
      </noscript>
      <React.Suspense fallback={null}>
        <YandexMetrikaPageview counterIds={normalizedCounterIds} />
      </React.Suspense>
      {isHydrated && !isNoticeDismissed ? (
        <YandexMetrikaNoticeBanner
          onDismiss={handleNoticeDismiss}
        />
      ) : null}
    </>
  );
};
