"use client";

import { useEditCatalogDrawer } from "@/core/widgets/edit-catalog-drawer/model/use-edit-catalog-drawer";
import { CatalogEditForm } from "@/core/widgets/edit-catalog-drawer/ui/catalog-edit-form";
import type { CheckoutConfig } from "@/shared/lib/checkout-methods";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { Progress } from "@/shared/ui/progress";
import React from "react";

type EditCatalogDrawerProps = {
  checkoutConfig?: CheckoutConfig;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export const EditCatalogDrawer: React.FC<EditCatalogDrawerProps> = ({
  checkoutConfig,
  open,
  onOpenChange,
  trigger,
}) => {
  const {
    bgUrl,
    checkoutConfig: resolvedCheckoutConfig,
    errorMessage,
    form,
    handleOpenChange,
    handleSaveInPlace,
    handleSubmit,
    isSubmitting,
    logoUrl,
    open: drawerOpen,
    uploadState,
  } = useEditCatalogDrawer({
    checkoutConfig,
    open,
    onOpenChange,
  });

  const resolvedTrigger =
    trigger === undefined ? (
      <Button size="sm" variant="outline">
        Редактировать профиль
      </Button>
    ) : (
      trigger
    );

  return (
    <AppDrawer
      open={drawerOpen}
      onOpenChange={handleOpenChange}
      dismissible={!isSubmitting}
      trigger={resolvedTrigger}
    >
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Редактор профиля"
            withCloseButton={!isSubmitting}
          />
          <hr />

          <DrawerScrollArea className="py-6">
            <div className="space-y-5">
              <CatalogEditForm
                form={form}
                checkoutConfig={resolvedCheckoutConfig}
                disabled={isSubmitting}
                isSaving={isSubmitting}
                onSave={handleSaveInPlace}
                logoUrl={logoUrl}
                bgUrl={bgUrl}
              />

              {uploadState.phase !== "idle" ? (
                <div className="mx-5 space-y-2 rounded-panel border border-line-default bg-surface-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span>{uploadState.message}</span>
                    <span className="text-text-muted">
                      {Math.round(uploadState.progress)}%
                    </span>
                  </div>
                  <Progress value={uploadState.progress} />
                </div>
              ) : null}

              {errorMessage ? (
                <div className="mx-5 rounded-panel border border-status-danger/30 bg-status-danger-surface p-4 text-sm text-status-danger">
                  {errorMessage}
                </div>
              ) : null}
            </div>
          </DrawerScrollArea>

          <AppDrawer.Footer
            className="border-t"
            isAutoClose={false}
            loading={isSubmitting}
            btnText="Сохранить изменения"
            handleClick={() => void handleSubmit()}
          />
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
