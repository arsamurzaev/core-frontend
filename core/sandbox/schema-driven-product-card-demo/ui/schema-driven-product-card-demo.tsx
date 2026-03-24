"use client";

import {
  useProductControllerGetAll,
  useProductControllerGetBySlug,
  useProductControllerGetPopular,
  type ProductWithDetailsDto,
} from "@/shared/api/generated";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { ContentContainer } from "@/shared/ui/layout/content-container";
import { Skeleton } from "@/shared/ui/skeleton";
import React from "react";
import { CAFE_BEAN_ORIGIN_KEY, OUTERWEAR_SIZE_KEY } from "../model/constants";
import { SchemaDrivenProductCard } from "./schema-driven-product-card";

type SupportedTypeCode = "cloth" | "cafe";

interface TypeCardConfig {
  title: string;
  extraAttributeKey: string;
  extraAttributeLabel: string;
}

const TYPE_CARD_CONFIG: Record<SupportedTypeCode, TypeCardConfig> = {
  cloth: {
    title: "Одежда",
    extraAttributeKey: OUTERWEAR_SIZE_KEY,
    extraAttributeLabel: "Размер",
  },
  cafe: {
    title: "Ресторан",
    extraAttributeKey: CAFE_BEAN_ORIGIN_KEY,
    extraAttributeLabel: "Размер зерна",
  },
};

function getErrorText(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Не удалось загрузить товары для демо-карточки.";
}

export const SchemaDrivenProductCardDemo: React.FC = () => {
  const { type } = useCatalog();
  const typeCode = type.code.toLowerCase();
  const typeConfig = TYPE_CARD_CONFIG[typeCode as SupportedTypeCode] ?? null;

  const popularQuery = useProductControllerGetPopular({
    query: {
      staleTime: 30_000,
      retry: 1,
    },
  });

  const primaryProduct = popularQuery.data?.[0] ?? null;
  const needFallback = !popularQuery.isLoading && !primaryProduct;

  const allProductsQuery = useProductControllerGetAll({
    query: {
      enabled: needFallback,
      staleTime: 30_000,
      retry: 1,
    },
  });

  const fallbackSlug = allProductsQuery.data?.[0]?.slug ?? "";
  const fallbackDetailsQuery = useProductControllerGetBySlug(
    fallbackSlug,
    {
      query: {
        enabled: needFallback && Boolean(fallbackSlug),
        staleTime: 30_000,
        retry: 1,
      },
    },
  );

  const fallbackProduct: ProductWithDetailsDto | null =
    fallbackDetailsQuery.data ?? null;

  const product = primaryProduct ?? fallbackProduct;
  const isLoading =
    popularQuery.isLoading ||
    (needFallback && allProductsQuery.isLoading) ||
    (needFallback && Boolean(fallbackSlug) && fallbackDetailsQuery.isLoading);

  const error =
    popularQuery.error ?? allProductsQuery.error ?? fallbackDetailsQuery.error;
  const hasError = Boolean(error);

  return (
    <section className="pb-8">
      <ContentContainer>
        <div className="mx-2.5 space-y-4 rounded-xl border bg-background/90 p-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">
              Sandbox Product Card (Backend Data)
            </h2>
            <p className="text-xs text-muted-foreground">
              Каталог: <span className="font-medium">{type.name}</span>, type
              key: <span className="font-medium">{type.code}</span>
            </p>
          </div>

          {!typeConfig && (
            <p className="text-sm text-muted-foreground">
              Демо-надстройка поддерживает только типы <code>cloth</code> и{" "}
              <code>cafe</code>.
            </p>
          )}

          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-52 w-full rounded-lg" />
            </div>
          )}

          {!isLoading && hasError && (
            <p className="text-sm text-destructive">{getErrorText(error)}</p>
          )}

          {!isLoading && !hasError && !product && (
            <p className="text-sm text-muted-foreground">
              В текущем каталоге нет товаров для отображения демо-карточки.
            </p>
          )}

          {!isLoading && !hasError && product && (
            <div className="space-y-2 grid grid-cols-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {typeConfig?.title ?? "Каталог"}
              </p>
              <SchemaDrivenProductCard
                data={product}
                extraAttribute={
                  typeConfig
                    ? {
                        key: typeConfig.extraAttributeKey,
                        label:
                          type.attributes.find(
                            (attribute) =>
                              attribute.key === typeConfig.extraAttributeKey,
                          )?.displayName ?? typeConfig.extraAttributeLabel,
                      }
                    : undefined
                }
              />
            </div>
          )}
        </div>
      </ContentContainer>
    </section>
  );
};
