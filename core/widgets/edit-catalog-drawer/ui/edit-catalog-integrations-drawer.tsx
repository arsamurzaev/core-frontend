"use client";

import {
  useCatalogAdvancedSettingsControllerGetIikoStatus,
  useCatalogAdvancedSettingsControllerGetMoySkladStatus,
} from "@/shared/api/generated/react-query";
import { useCatalogCapabilities } from "@/shared/capabilities/catalog-capabilities";
import { AdminPanelButton } from "@/shared/ui/admin-panel";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Badge } from "@/shared/ui/badge";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { ChevronRight } from "lucide-react";
import React from "react";

import { EditCatalogIikoDrawer } from "./edit-catalog-iiko-drawer";
import { EditCatalogMoySkladDrawer } from "./edit-catalog-moysklad-drawer";

function getIntegrationsSummary(params: {
  configuredCount: number;
  hasActiveRun: boolean;
}) {
  if (params.hasActiveRun) {
    return {
      badge: "Синхронизация",
      description: "МойСклад уже синхронизируется или ожидает запуска.",
    };
  }

  if (params.configuredCount > 0) {
    return {
      badge: `${params.configuredCount} подключение`,
      description: "Внешние источники подключены к текущему каталогу.",
    };
  }

  return {
    badge: "Не настроено",
    description:
      "Подключите внешний источник товаров и настройте синхронизацию.",
  };
}

export const EditCatalogIntegrationsDrawer: React.FC<{
  disabled?: boolean;
}> = ({ disabled = false }) => {
  const features = useCatalogCapabilities();
  const [open, setOpen] = React.useState(false);
  const statusQuery = useCatalogAdvancedSettingsControllerGetMoySkladStatus({
    query: {
      enabled: features.canUseMoySkladIntegration,
      staleTime: 30_000,
    },
  });
  const iikoStatusQuery = useCatalogAdvancedSettingsControllerGetIikoStatus({
    query: {
      enabled: features.canUseIikoIntegration,
      staleTime: 30_000,
    },
  });

  if (!features.canUseMoySkladIntegration && !features.canUseIikoIntegration) {
    return null;
  }

  const configuredCount = [
    features.canUseMoySkladIntegration && statusQuery.data?.configured,
    features.canUseIikoIntegration && iikoStatusQuery.data?.configured,
  ].filter(Boolean).length;
  const summary = getIntegrationsSummary({
    configuredCount,
    hasActiveRun: Boolean(statusQuery.data?.activeRun || iikoStatusQuery.data?.activeRun),
  });

  return (
    <AppDrawer
      nested
      open={open}
      onOpenChange={setOpen}
      dismissible={!disabled}
      trigger={
        <AdminPanelButton disabled={disabled}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-text-primary">
                Интеграции
              </span>
              <Badge
                variant="secondary"
                className="max-w-full break-words text-left whitespace-normal"
              >
                {summary.badge}
              </Badge>
            </div>
            <p className="mt-1 break-words text-sm text-text-muted whitespace-normal">
              {summary.description}
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-text-muted" />
        </AdminPanelButton>
      }
    >
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Интеграции"
            description="Подключите внешние сервисы и управляйте синхронизацией текущего каталога."
            withCloseButton={!disabled}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="space-y-4">
              {features.canUseMoySkladIntegration ? (
                <EditCatalogMoySkladDrawer disabled={disabled} />
              ) : null}
              {features.canUseIikoIntegration ? (
                <EditCatalogIikoDrawer disabled={disabled} />
              ) : null}
            </div>
          </DrawerScrollArea>

          <AppDrawer.Footer
            className="border-t"
            btnText="Готово"
            buttonType="button"
          />
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
