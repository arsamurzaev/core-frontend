import Script from "next/script";
import React from "react";

interface YandexMetrikaProps {
  counterIds: Array<string | null | undefined>;
}

function normalizeCounterIds(counterIds: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const normalizedIds: string[] = [];

  counterIds.forEach((counterId) => {
    const value = String(counterId ?? "").trim();

    if (!/^\d+$/.test(value) || seen.has(value)) {
      return;
    }

    seen.add(value);
    normalizedIds.push(value);
  });

  return normalizedIds;
}

function buildYandexMetrikaSnippet(counterIds: string[]) {
  const idsJson = JSON.stringify(counterIds);

  return `
    (function(m,e,t,r,i,k,a){
      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (var j = 0; j < document.scripts.length; j++) {
        if (document.scripts[j].src === r) { return; }
      }
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${counterIds[0]}', 'ym');

    window.dataLayer = window.dataLayer || [];
    ${idsJson}.forEach(function(counterId) {
      ym(Number(counterId), 'init', {
        ssr: true,
        webvisor: true,
        clickmap: true,
        ecommerce: "dataLayer",
        referrer: document.referrer,
        url: location.href,
        accurateTrackBounce: true,
        trackLinks: true
      });
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
      <Script
        id="yandex-metrika"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: buildYandexMetrikaSnippet(normalizedCounterIds),
        }}
      />
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
