"use client";

import {
  normalizeTimeZone,
  resolveBrowserTimeZone,
} from "@/core/widgets/edit-catalog-drawer/lib/moysklad-form-state";
import { DEFAULT_DAILY_SYNC_HOUR } from "@/core/widgets/edit-catalog-drawer/lib/moysklad-schedule";
import {
  getStatusBadge,
  getStatusDescription,
} from "@/core/widgets/edit-catalog-drawer/lib/moysklad-status";
import {
  getCatalogAdvancedSettingsControllerGetMoySkladQueryKey,
  getCatalogAdvancedSettingsControllerGetMoySkladRunsQueryKey,
  getCatalogAdvancedSettingsControllerGetMoySkladStatusQueryKey,
  type UpdateMoySkladIntegrationDtoReq,
  type UpsertMoySkladIntegrationDtoReq,
  useCatalogAdvancedSettingsControllerGetMoySkladStatus,
  useCatalogAdvancedSettingsControllerUpdateMoySklad,
  useCatalogAdvancedSettingsControllerUpsertMoySklad,
} from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import React from "react";
import { toast } from "sonner";

type CatalogFormState = {
  token: string;
  stockWebhookEnabled: boolean;
};

type ValidationErrors = Partial<Record<"token", string>>;

async function refreshIntegrationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: getCatalogAdvancedSettingsControllerGetMoySkladStatusQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getCatalogAdvancedSettingsControllerGetMoySkladQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getCatalogAdvancedSettingsControllerGetMoySkladRunsQueryKey(),
    }),
  ]);
}

export const EditCatalogMoySkladDrawerCatalog: React.FC<{
  disabled?: boolean;
}> = ({ disabled = false }) => {
  const queryClient = useQueryClient();
  const statusQuery = useCatalogAdvancedSettingsControllerGetMoySkladStatus({
    query: {
      staleTime: 30_000,
    },
  });
  const upsertMutation = useCatalogAdvancedSettingsControllerUpsertMoySklad();
  const updateMutation = useCatalogAdvancedSettingsControllerUpdateMoySklad();

  const [open, setOpen] = React.useState(false);
  const [formState, setFormState] = React.useState<CatalogFormState>({
    token: "",
    stockWebhookEnabled: false,
  });
  const [validationErrors, setValidationErrors] =
    React.useState<ValidationErrors>({});
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const status = statusQuery.data;
  const integration = status?.integration;
  const isConfigured = Boolean(status?.configured);
  const isBusy =
    disabled ||
    isSaving ||
    upsertMutation.isPending ||
    updateMutation.isPending;
  const statusBadge = getStatusBadge({
    configured: isConfigured,
    isActive: integration?.isActive,
    hasActiveRun: Boolean(status?.activeRun),
  });
  const statusDescription = getStatusDescription(status);

  const resetLocalState = React.useCallback(() => {
    setFormState({
      token: "",
      stockWebhookEnabled: integration?.stockWebhook?.enabled ?? false,
    });
    setValidationErrors({});
    setErrorMessage(null);
  }, [integration?.stockWebhook?.enabled]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      if (nextOpen) {
        resetLocalState();
        void statusQuery.refetch();
      }
    },
    [resetLocalState, statusQuery],
  );

  const setFieldValue = React.useCallback((value: string) => {
    setFormState((prev) => ({ ...prev, token: value }));
    setErrorMessage(null);
    setValidationErrors((prev) => ({ ...prev, token: undefined }));
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (isBusy) return;

    const trimmedToken = formState.token.trim();
    const nextErrors: ValidationErrors = {};

    if (!isConfigured && !trimmedToken) {
      nextErrors.token = "Введите токен MoySklad.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const preferredTimeZone = normalizeTimeZone(
        integration?.scheduleTimezone ?? resolveBrowserTimeZone(),
      );

      const commonPayload = {
        isActive: true,
        importImages: true,
        syncStock: true,
        stockWebhookEnabled: formState.stockWebhookEnabled,
        scheduleEnabled: true,
        schedulePattern: `0 ${DEFAULT_DAILY_SYNC_HOUR} * * *`,
        scheduleTimezone: preferredTimeZone,
      };

      if (isConfigured) {
        const payload: UpdateMoySkladIntegrationDtoReq = {
          ...commonPayload,
          ...(trimmedToken ? { token: trimmedToken } : {}),
        };

        await updateMutation.mutateAsync({ data: payload });
      } else {
        const payload: UpsertMoySkladIntegrationDtoReq = {
          ...commonPayload,
          token: trimmedToken,
        };

        await upsertMutation.mutateAsync({ data: payload });
      }

      await refreshIntegrationQueries(queryClient);
      toast.success(
        isConfigured
          ? "Токен MoySklad обновлён."
          : "Интеграция MoySklad подключена. Первый импорт запустится автоматически.",
      );
      setOpen(false);
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }, [
    formState.token,
    formState.stockWebhookEnabled,
    integration?.scheduleTimezone,
    isBusy,
    isConfigured,
    queryClient,
    updateMutation,
    upsertMutation,
  ]);

  return (
    <AppDrawer
      nested
      open={open}
      onOpenChange={handleOpenChange}
      dismissible={!isBusy}
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
                MoySklad
              </span>
              <Badge
                variant={statusBadge.variant}
                className="max-w-full break-words text-left whitespace-normal"
              >
                {statusBadge.label}
              </Badge>
            </div>
            <p className="mt-1 break-words text-sm text-muted-foreground whitespace-normal">
              {statusDescription}
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      }
    >
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="MoySklad"
            description="Вставьте токен, а остальные базовые настройки приложение включит автоматически."
            withCloseButton={!isBusy}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="space-y-5">
              <div className="rounded-2xl border border-black/10 bg-muted/15 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium">Статус</span>
                  <Badge
                    variant={statusBadge.variant}
                    className="max-w-full break-words text-left whitespace-normal"
                  >
                    {statusBadge.label}
                  </Badge>
                </div>
                <p className="mt-2 break-words text-sm text-muted-foreground">
                  {statusDescription}
                </p>
              </div>

              <div className="rounded-2xl border border-black/10 bg-background/70 p-4">
                <div className="text-sm font-medium">
                  Что включится по умолчанию
                </div>
                <p className="mt-2 break-words text-sm text-muted-foreground">
                  Импорт изображений, синхронизация остатков и ежедневный sync.
                  Часовой пояс берём из браузера, а если он недоступен,
                  используем Москву.
                </p>
              </div>

              <Field
                orientation="responsive"
                className="rounded-2xl border border-black/10 bg-background/70 p-4"
              >
                <FieldContent>
                  <FieldTitle>Быстрые остатки через webhook</FieldTitle>
                  <FieldDescription className="break-words">
                    MoySklad будет присылать изменения остатков без ожидания
                    планового sync.
                  </FieldDescription>
                </FieldContent>
                <Switch
                  checked={formState.stockWebhookEnabled}
                  onCheckedChange={(checked) => {
                    setFormState((prev) => ({
                      ...prev,
                      stockWebhookEnabled: checked,
                    }));
                    setErrorMessage(null);
                  }}
                  disabled={isBusy || integration?.capabilities.webhook === false}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="moysklad-token-catalog">Токен</FieldLabel>
                <FieldContent>
                  <Input
                    autoComplete="off"
                    value={formState.token}
                    onChange={(event) => setFieldValue(event.target.value)}
                    placeholder={
                      integration?.tokenPreview
                        ? `${integration.tokenPreview} • оставьте пустым, чтобы не менять`
                        : "Введите токен MoySklad"
                    }
                    disabled={isBusy}
                  />
                  <FieldDescription className="break-words">
                    {isConfigured
                      ? "Если оставить поле пустым, текущий токен сохранится."
                      : "После сохранения первый импорт запустится автоматически."}
                  </FieldDescription>
                  <FieldError>{validationErrors.token}</FieldError>
                </FieldContent>
              </Field>

              {errorMessage ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {errorMessage}
                </div>
              ) : null}
            </div>
          </DrawerScrollArea>

          <AppDrawer.Footer
            className="border-t"
            isAutoClose={false}
            loading={isBusy}
            btnText={isConfigured ? "Обновить токен" : "Подключить MoySklad"}
            handleClick={() => void handleSubmit()}
          />
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
