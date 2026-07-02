"use client";

import type { ProductDrawerAttributeRow } from "@/core/widgets/product-drawer/model/product-drawer-view";
import { Skeleton } from "@/shared/ui/skeleton";

interface ProductDrawerOverviewHeaderProps {
  brandName?: string;
  description: string;
  displayName: string;
  hasError: boolean;
  isLoading: boolean;
  subtitle: string;
  variantsSummary: string | null;
}

interface ProductDrawerOverviewMetaProps {
  attributeRows: ProductDrawerAttributeRow[];
  isLoading: boolean;
}

export function ProductDrawerOverviewHeader({
  brandName,
  description,
  displayName,
  hasError,
  isLoading,
  subtitle,
  variantsSummary,
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
          {brandName ? (
            <p className="text-sm font-semibold text-text-primary">
              {brandName}
            </p>
          ) : null}
          <h2 className="text-2xl font-bold sm:text-3xl">{displayName}</h2>
          {variantsSummary ? (
            <p className="text-text-muted text-xs leading-tight sm:text-sm">
              {variantsSummary}
            </p>
          ) : null}
          {subtitle ? (
            <p className="text-left text-base font-light text-text-primary sm:text-lg">
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
        <div className="rounded-control border border-status-danger/30 bg-status-danger-surface p-3 text-sm text-status-danger">
          Не удалось загрузить товар. Попробуйте снова.
        </div>
      ) : null}
    </div>
  );
}

export function ProductDrawerOverviewMeta({
  attributeRows,
  isLoading,
}: ProductDrawerOverviewMetaProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 px-4 pb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (attributeRows.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1 px-4 pb-4 text-left">
      {attributeRows.map((attribute) => (
        <p
          key={attribute.id}
          className="text-text-muted text-xs sm:text-sm"
        >
          <span className="text-text-primary font-medium">
            {attribute.label}:
          </span>{" "}
          {attribute.value}
        </p>
      ))}
    </div>
  );
}
