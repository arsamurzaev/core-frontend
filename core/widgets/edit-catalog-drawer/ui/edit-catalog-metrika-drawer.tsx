"use client";

import {
  getCatalogAdvancedSettingsControllerGetYandexMetrikaQueryKey,
  type CatalogYandexMetrikaDto,
  useCatalogAdvancedSettingsControllerDeleteYandexMetrika,
  useCatalogAdvancedSettingsControllerGetYandexMetrika,
  useCatalogAdvancedSettingsControllerUpdateYandexMetrika,
} from "@/shared/api/generated/react-query";
import { revalidateStorefrontCacheBestEffort } from "@/shared/api/revalidate-storefront-client";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { FieldError } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface EditCatalogMetrikaDrawerProps {
  disabled?: boolean;
}

function extractYandexMetrikaCounterId(value: unknown): string {
  const source = typeof value === "string" ? value.trim() : "";

  if (!source) {
    return "";
  }

  const patterns = [
    /ym\(\s*(\d+)/i,
    /tag\.js\?id=(\d+)/i,
    /mc\.yandex\.[a-z.]+\/watch\/(\d+)/i,
    /(?:^|[?&])id=(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  if (/^\d+$/.test(source)) {
    return source;
  }

  return source.match(/\d{3,}/)?.[0] ?? source.replace(/\D/g, "");
}

function validateCounterId(counterId: string): string | null {
  if (counterId.length === 0) {
    return null;
  }

  return /^\d{3,20}$/.test(counterId)
    ? null
    : "Укажите id счётчика Яндекс Метрики: только цифры.";
}

export const EditCatalogMetrikaDrawer: React.FC<
  EditCatalogMetrikaDrawerProps
> = ({ disabled = false }) => {
  const queryClient = useQueryClient();
  const metrikaQuery = useCatalogAdvancedSettingsControllerGetYandexMetrika({
    query: {
      enabled: !disabled,
      staleTime: 30_000,
    },
  });
  const updateMetrika = useCatalogAdvancedSettingsControllerUpdateYandexMetrika();
  const deleteMetrika = useCatalogAdvancedSettingsControllerDeleteYandexMetrika();
  const currentCounterId = metrikaQuery.data?.counterId ?? "";
  const [open, setOpen] = React.useState(false);
  const [counterId, setCounterId] = React.useState(currentCounterId);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isTouched, setIsTouched] = React.useState(false);
  const isSaving = updateMetrika.isPending || deleteMetrika.isPending;
  const queryKey = React.useMemo(
    () => getCatalogAdvancedSettingsControllerGetYandexMetrikaQueryKey(),
    [],
  );
  const badgeText = metrikaQuery.isLoading
    ? "Загрузка"
    : currentCounterId
      ? `id ${currentCounterId}`
      : "Не подключена";

  React.useEffect(() => {
    if (!open) {
      setCounterId(currentCounterId);
      setErrorMessage(null);
      setIsTouched(false);
      return;
    }

    if (!isTouched) {
      setCounterId(currentCounterId);
    }
  }, [currentCounterId, isTouched, open]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      if (nextOpen) {
        setCounterId(currentCounterId);
        setErrorMessage(null);
        setIsTouched(false);
      }
    },
    [currentCounterId],
  );

  const handleCounterIdChange = React.useCallback((value: string) => {
    const nextCounterId = extractYandexMetrikaCounterId(value);
    setIsTouched(true);
    setCounterId(nextCounterId);
    setErrorMessage(validateCounterId(nextCounterId));
  }, []);

  const syncMetrikaCounter = React.useCallback(async (nextCounterId: string) => {
    queryClient.setQueryData<CatalogYandexMetrikaDto>(queryKey, {
      counterId: nextCounterId || null,
    });

    await Promise.allSettled([
      queryClient.invalidateQueries({
        queryKey,
      }),
      revalidateStorefrontCacheBestEffort(),
    ]);
  }, [queryClient, queryKey]);

  const handleSave = React.useCallback(async () => {
    const validationError = validateCounterId(counterId);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage(null);

    try {
      if (counterId) {
        await updateMetrika.mutateAsync({ data: { counterId } });
      } else {
        await deleteMetrika.mutateAsync();
      }

      await syncMetrikaCounter(counterId);
      toast.success("Яндекс Метрика сохранена для каталога.");
      setOpen(false);
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    }
  }, [counterId, deleteMetrika, syncMetrikaCounter, updateMetrika]);

  return (
    <AppDrawer
      nested
      open={open}
      onOpenChange={handleOpenChange}
      dismissible={!disabled && !isSaving}
      trigger={
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full min-w-0 items-start justify-between rounded-2xl border border-black/10 px-4 py-4 text-left whitespace-normal hover:bg-muted/30"
          disabled={disabled}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                Яндекс Метрика
              </span>
              <Badge variant="secondary">
                {badgeText}
              </Badge>
            </div>
            <p className="mt-1 break-words text-sm text-muted-foreground whitespace-normal">
              Счётчик аналитики для текущего каталога. Можно вставить id или код.
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      }
    >
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Яндекс Метрика"
            description="Вставьте id счётчика или код Метрики. Мы сохраним только id для текущего каталога."
            withCloseButton={!disabled && !isSaving}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="catalog-yandex-metrika-id">
                  ID счётчика
                </Label>
                <Input
                  id="catalog-yandex-metrika-id"
                  value={counterId}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="12345678"
                  disabled={disabled || isSaving}
                  className="border border-black/10"
                  onChange={(event) =>
                    handleCounterIdChange(event.target.value)
                  }
                  onPaste={(event) => {
                    event.preventDefault();
                    handleCounterIdChange(event.clipboardData.getData("text"));
                  }}
                />
              </div>

              {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
              {metrikaQuery.isError ? (
                <FieldError>
                  Не удалось загрузить сохранённый счётчик Метрики.
                </FieldError>
              ) : null}
            </div>
          </DrawerScrollArea>

          <AppDrawer.Footer
            className="border-t"
            btnText="Сохранить"
            isAutoClose={false}
            loading={isSaving}
            handleClick={() => void handleSave()}
            buttonType="button"
          />
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
