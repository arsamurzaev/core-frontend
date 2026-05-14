"use client";

import {
  type ProductTypeCompatibilityIssueDto,
  type ProductTypeCompatibilityPreviewDto,
} from "@/shared/api/generated/react-query";
import { Button } from "@/shared/ui/button";
import { Loader2 } from "lucide-react";
import React from "react";

interface ProductTypeChangePreviewProps {
  currentProductTypeId: string | null;
  disabled?: boolean;
  isApplying?: boolean;
  isPreviewing?: boolean;
  preview: ProductTypeCompatibilityPreviewDto | null;
  selectedProductTypeId: string | null;
  onApply: () => void;
  onCancel: () => void;
}

function renderIssueList(issues: ProductTypeCompatibilityIssueDto[]) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-1 text-xs text-muted-foreground">
      {issues.slice(0, 5).map((issue) => (
        <li key={`${issue.attributeId}-${issue.reason}`}>
          {issue.displayName} ({issue.key})
        </li>
      ))}
      {issues.length > 5 ? <li>+{issues.length - 5}</li> : null}
    </ul>
  );
}

export const ProductTypeChangePreview: React.FC<
  ProductTypeChangePreviewProps
> = ({
  currentProductTypeId,
  disabled,
  isApplying,
  isPreviewing,
  preview,
  selectedProductTypeId,
  onApply,
  onCancel,
}) => {
  const hasChanged = selectedProductTypeId !== currentProductTypeId;
  const isWorking = hasChanged && (isPreviewing || isApplying || !preview);
  const productConflicts = preview?.productAttributeConflicts ?? [];
  const variantConflicts = preview?.variantAttributeConflicts ?? [];
  const hasConflicts = productConflicts.length > 0 || variantConflicts.length > 0;
  const canApply = Boolean(
    preview &&
      hasChanged &&
      preview.requestedProductTypeId === selectedProductTypeId &&
      preview.compatible &&
      preview.canChangeNow &&
      !preview.requiresUserDecision,
  );

  if (!hasChanged) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {isWorking
            ? "Применяем тип товара"
            : "Тип товара не применился автоматически"}
        </p>
        <p className="text-xs leading-5 text-muted-foreground">
          {isWorking
            ? "Система сама подготовит выбранный тип. Если данные подходят, вариации откроются без дополнительных действий."
            : "В товаре уже есть характеристики или варианты, которые не подходят выбранному типу. Верните прежний тип или выберите другой."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isWorking ? (
          <div className="inline-flex min-h-8 items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            {isApplying ? "Применяем..." : "Подготавливаем..."}
          </div>
        ) : null}

        {!isWorking ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={onCancel}
          >
            Вернуть прежний тип
          </Button>
        ) : null}

        {!isWorking && canApply ? (
          <Button
            type="button"
            size="sm"
            disabled={disabled || isApplying || !canApply}
            onClick={onApply}
          >
            {isApplying ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Применить тип
          </Button>
        ) : null}
      </div>

      {!isWorking && preview ? (
        <div className="space-y-2 text-sm">
          {preview.blockingReason ? (
            <p className="text-destructive">{preview.blockingReason}</p>
          ) : preview.compatible ? (
            <p className="text-green-700">
              Тип можно применить без потери данных.
            </p>
          ) : (
            <p className="text-amber-700">
              Выбранный тип не совпадает с текущими характеристиками товара.
            </p>
          )}

          {hasConflicts ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium">Характеристики</p>
                {renderIssueList(productConflicts)}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium">Варианты</p>
                {renderIssueList(variantConflicts)}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
