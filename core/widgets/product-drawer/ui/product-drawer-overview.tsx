"use client";

import { Skeleton } from "@/shared/ui/skeleton";

interface ProductDrawerOverviewHeaderProps {
  description: string;
  displayName: string;
  hasError: boolean;
  isLoading: boolean;
  subtitle: string;
}

interface ProductDrawerOverviewMetaProps {
  brandName?: string;
  isLoading: boolean;
  variantsSummary: string | null;
}

export function ProductDrawerOverviewHeader({
  description,
  displayName,
  hasError,
  isLoading,
  subtitle,
}: ProductDrawerOverviewHeaderProps) {
  return (
    <div className="space-y-2 px-4 text-left">
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold sm:text-3xl">
            {displayName}
          </h2>
          {subtitle ? (
            <p className="text-left text-base font-light text-foreground sm:text-lg">
              {subtitle}
            </p>
          ) : null}
          {description ? (
            <p className="text-xs break-words whitespace-pre-wrap sm:text-base">
              {description}
            </p>
          ) : null}
        </>
      )}

      {hasError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Не удалось загрузить товар. Попробуйте снова.
        </div>
      ) : null}
    </div>
  );
}

export function ProductDrawerOverviewMeta({
  brandName,
  isLoading,
  variantsSummary,
}: ProductDrawerOverviewMetaProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 px-4 pb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!brandName && !variantsSummary) {
    return null;
  }

  return (
    <div className="space-y-1 px-4 pb-4 text-left">
      {brandName ? (
        <p className="text-muted-foreground text-xs sm:text-sm">
          <span className="text-foreground font-medium">Бренд:</span> {brandName}
        </p>
      ) : null}
      {variantsSummary ? (
        <p className="text-muted-foreground text-xs sm:text-sm">
          <span className="text-foreground font-medium">Вариации:</span>{" "}
          {variantsSummary}
        </p>
      ) : null}
    </div>
  );
}
