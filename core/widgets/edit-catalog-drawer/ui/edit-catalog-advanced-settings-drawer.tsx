"use client";

import { EditCatalogDomainsDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-domains-drawer";
import { EditCatalogIntegrationsDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-integrations-drawer";
import { EditCatalogMetrikaDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-metrika-drawer";
import { EditCatalogPasswordDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-password-drawer";
import { EditCatalogSessionsDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-sessions-drawer";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Badge } from "@/shared/ui/badge";
import { Button, type ButtonProps } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { ChevronRight } from "lucide-react";
import React from "react";

interface EditCatalogAdvancedSettingsDrawerProps {
  disabled?: boolean;
}

const DefaultAdvancedSettingsTrigger = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ disabled, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      {...props}
      type="button"
      variant="ghost"
      className="h-auto w-full min-w-0 items-start justify-between rounded-2xl border border-black/10 px-4 py-4 text-left whitespace-normal hover:bg-muted/30"
      disabled={disabled}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Расширенные настройки
          </span>
          <Badge variant="secondary">Доступ и подключения</Badge>
        </div>
        <p className="mt-1 break-words text-sm text-muted-foreground whitespace-normal">
          Пароль входа, сессии, домены, Яндекс Метрика и интеграции каталога.
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Button>
  );
});
DefaultAdvancedSettingsTrigger.displayName = "DefaultAdvancedSettingsTrigger";

export const EditCatalogAdvancedSettingsDrawer: React.FC<
  EditCatalogAdvancedSettingsDrawerProps
> = ({ disabled = false }) => {
  return (
    <AppDrawer
      nested
      dismissible={!disabled}
      trigger={<DefaultAdvancedSettingsTrigger disabled={disabled} />}
    >
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Расширенные настройки"
            description="Настройте доступ к каталогу, домены, аналитику и внешние подключения."
            withCloseButton={!disabled}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="grid gap-3">
              <EditCatalogPasswordDrawer disabled={disabled} />
              <EditCatalogSessionsDrawer disabled={disabled} />
              <EditCatalogDomainsDrawer disabled={disabled} />
              <EditCatalogMetrikaDrawer disabled={disabled} />
              <EditCatalogIntegrationsDrawer disabled={disabled} />
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
