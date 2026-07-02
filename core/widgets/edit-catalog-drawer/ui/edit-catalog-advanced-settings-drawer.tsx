"use client";

import { EditCatalogDomainsDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-domains-drawer";
import { EditCatalogInventoryDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-inventory-drawer";
import { EditCatalogIntegrationsDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-integrations-drawer";
import { EditCatalogMetrikaDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-metrika-drawer";
import { EditCatalogModifiersDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-modifiers-drawer";
import { EditCatalogPasswordDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-password-drawer";
import { EditCatalogProductTypesDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-product-types-drawer";
import { EditCatalogSaleUnitsDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-sale-units-drawer";
import { EditCatalogSessionsDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-sessions-drawer";
import {
  useCatalogCapabilities,
  useCatalogProductStructureVisibility,
} from "@/shared/capabilities/catalog-capabilities";
import { canManageCatalogContent } from "@/core/catalog-runtime/content-access";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Badge } from "@/shared/ui/badge";
import {
  AdminPanelButton,
  type AdminPanelButtonProps,
} from "@/shared/ui/admin-panel";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { ChevronRight } from "lucide-react";
import React from "react";

interface EditCatalogAdvancedSettingsDrawerProps {
  disabled?: boolean;
}

const DefaultAdvancedSettingsTrigger = React.forwardRef<
  HTMLButtonElement,
  AdminPanelButtonProps
>(({ disabled, ...props }, ref) => {
  return (
    <AdminPanelButton
      ref={ref}
      {...props}
      disabled={disabled}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-text-primary">
            Расширенные настройки
          </span>
          <Badge variant="secondary">Доступ и подключения</Badge>
        </div>
        <p className="mt-1 break-words text-sm text-text-muted whitespace-normal">
          Пароль входа, сессии, домены, Яндекс Метрика и интеграции каталога.
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-text-muted" />
    </AdminPanelButton>
  );
});
DefaultAdvancedSettingsTrigger.displayName = "DefaultAdvancedSettingsTrigger";

export const EditCatalogAdvancedSettingsDrawer: React.FC<
  EditCatalogAdvancedSettingsDrawerProps
> = ({ disabled = false }) => {
  const { catalog } = useCatalogState();
  const features = useCatalogCapabilities();
  const productStructure = useCatalogProductStructureVisibility(features);
  const canManageContent = canManageCatalogContent(catalog);
  const showInventory =
    canManageContent &&
    features.inventoryMode === "INTERNAL" &&
    features.canUseInternalInventory;

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
              {canManageContent && features.canUseCatalogSaleUnits ? (
                <EditCatalogSaleUnitsDrawer disabled={disabled} />
              ) : null}
              {canManageContent && productStructure.canUseProductTypes ? (
                <EditCatalogProductTypesDrawer disabled={disabled} />
              ) : null}
              {canManageContent && features.canUseCatalogModifiers ? (
                <EditCatalogModifiersDrawer disabled={disabled} />
              ) : null}
              {canManageContent &&
              (features.canUseMoySkladIntegration ||
                features.canUseIikoIntegration) ? (
                <EditCatalogIntegrationsDrawer disabled={disabled} />
              ) : null}
              {showInventory ? (
                <EditCatalogInventoryDrawer disabled={disabled} />
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
