import Script from "next/script";
import React from "react";

interface YandexMetrikaProps {
  counterIds?: Array<string | null | undefined> | null;
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

  return `
    (function(m,e,t,r,i,k,a){
      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (var j = 0; j < document.scripts.length; j++) {
        if (document.scripts[j].src === r) { return; }
      }
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js', 'ym');

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

export const YandexMetrika: React.FC<YandexMetrikaProps> = ({
  counterIds,
}) => {
  const normalizedCounterIds = normalizeCounterIds(counterIds);

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
    </>
  );
};
