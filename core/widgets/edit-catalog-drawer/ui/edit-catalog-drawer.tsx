"use client";

import { useEditCatalogDrawer } from "@/core/widgets/edit-catalog-drawer/model/use-edit-catalog-drawer";
import { CatalogEditForm } from "@/core/widgets/edit-catalog-drawer/ui/catalog-edit-form";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { Progress } from "@/shared/ui/progress";
import React from "react";

type EditCatalogDrawerProps = {
  trigger?: React.ReactNode;
};

export const EditCatalogDrawer: React.FC<EditCatalogDrawerProps> = ({
  trigger,
}) => {
  const {
    bgUrl,
    errorMessage,
    form,
    handleOpenChange,
    handleSubmit,
    isSubmitting,
    logoUrl,
    open,
    uploadState,
  } = useEditCatalogDrawer();

  return (
    <AppDrawer
      open={open}
      onOpenChange={handleOpenChange}
      dismissible={!isSubmitting}
      trigger={
        trigger ?? (
          <Button size="sm" variant="outline">
            Редактировать профиль
          </Button>
        )
      }
    >
      <AppDrawer.Content className="mx-auto w-full max-w-2xl">
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
                disabled={isSubmitting}
                logoUrl={logoUrl}
                bgUrl={bgUrl}
              />

              {uploadState.phase !== "idle" ? (
                <div className="mx-5 space-y-2 rounded-2xl border border-black/10 bg-muted/15 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span>{uploadState.message}</span>
                    <span className="text-muted-foreground">
                      {Math.round(uploadState.progress)}%
                    </span>
                  </div>
                  <Progress value={uploadState.progress} />
                </div>
              ) : null}

              {errorMessage ? (
                <div className="mx-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
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
