"use client";

import { useIntegrationControllerGetMoySkladStatus } from "@/shared/api/generated/react-query";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { ChevronRight } from "lucide-react";
import React from "react";

import { EditCatalogMoySkladDrawer } from "./edit-catalog-moysklad-drawer";

function getIntegrationsSummary(params: {
  configured: boolean;
  hasActiveRun: boolean;
}) {
  if (params.hasActiveRun) {
    return {
      badge: "Синхронизация",
      description: "MoySklad уже в работе или ожидает запуска.",
    };
  }

  if (params.configured) {
    return {
      badge: "1 подключение",
      description: "MoySklad настроен для текущего каталога.",
    };
  }

  return {
    badge: "Не настроено",
    description:
      "Подключите внешний источник товаров и синхронизацию в одном месте.",
  };
}

export const EditCatalogIntegrationsDrawer: React.FC<{
  disabled?: boolean;
}> = ({ disabled = false }) => {
  const [open, setOpen] = React.useState(false);
  const statusQuery = useIntegrationControllerGetMoySkladStatus({
    query: {
      staleTime: 30_000,
    },
  });

  const summary = getIntegrationsSummary({
    configured: Boolean(statusQuery.data?.configured),
    hasActiveRun: Boolean(statusQuery.data?.activeRun),
  });

  return (
    <div className="w-full px-5">
      <AppDrawer
        nested
        open={open}
        onOpenChange={setOpen}
        dismissible={!disabled}
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
                  Интеграции
                </span>
                <Badge
                  variant="secondary"
                  className="max-w-full break-words text-left whitespace-normal"
                >
                  {summary.badge}
                </Badge>
              </div>
              <p className="mt-1 break-words text-sm text-muted-foreground whitespace-normal">
                {summary.description}
              </p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        }
      >
        <AppDrawer.Content className="mx-auto w-full max-w-xl">
          <div className="flex min-h-0 flex-1 flex-col">
            <AppDrawer.Header
              title="Интеграции"
              description="Подключите внешние сервисы для каталога в одном месте."
              withCloseButton={!disabled}
            />
            <hr />

            <DrawerScrollArea className="px-5 py-5">
              <div className="space-y-4">
                <EditCatalogMoySkladDrawer disabled={disabled} />
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
    </div>
  );
};
