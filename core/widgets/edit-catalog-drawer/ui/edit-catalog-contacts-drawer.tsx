"use client";

import { CONTACT_DRAWER_DESCRIPTION } from "@/core/widgets/edit-catalog-drawer/model/edit-catalog-contacts";
import {
  CATALOG_CONTACT_FIELDS,
  type CatalogEditFormValues,
} from "@/core/widgets/edit-catalog-drawer/model/form-config";
import { useEditCatalogContactValues } from "@/core/widgets/edit-catalog-drawer/model/use-edit-catalog-contact-values";
import { EditCatalogContactFieldRow } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-contact-field-row";
import { EditCatalogContactIconsPreview } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-contact-icons-preview";
import { cn } from "@/shared/lib/utils";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { ChevronRight } from "lucide-react";
import React from "react";
import { Controller, type UseFormReturn } from "react-hook-form";

type EditCatalogContactsDrawerProps = {
  form: UseFormReturn<CatalogEditFormValues>;
  disabled?: boolean;
  isSaving?: boolean;
};

export const EditCatalogContactsDrawer: React.FC<
  EditCatalogContactsDrawerProps
> = ({ form, disabled = false, isSaving = false }) => {
  const [open, setOpen] = React.useState(false);
  const { contactValues, hasContacts } = useEditCatalogContactValues(form);

  return (
    <AppDrawer
      open={open}
      onOpenChange={setOpen}
      dismissible={!disabled && !isSaving}
      trigger={
        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground h-auto w-full min-w-0 items-start justify-between px-0 py-0 text-left whitespace-normal hover:bg-transparent"
          disabled={disabled}
        >
          {hasContacts ? (
            <EditCatalogContactIconsPreview values={contactValues} />
          ) : null}
          <span
            className={cn(
              "inline-flex min-w-0 flex-1 items-start gap-2 text-left text-sm whitespace-normal",
              hasContacts && "ml-3",
            )}
          >
            <span className="min-w-0 break-words whitespace-normal">
              {hasContacts ? "Изменить контакты" : "Добавить контакты"}
            </span>
            <ChevronRight className="mt-0.5 size-4 shrink-0" />
          </span>
        </Button>
      }
    >
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Контакты"
            description={CONTACT_DRAWER_DESCRIPTION}
            withCloseButton={!disabled && !isSaving}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="space-y-4">
              {CATALOG_CONTACT_FIELDS.map((fieldConfig) => (
                <Controller
                  key={fieldConfig.name}
                  control={form.control}
                  name={fieldConfig.name}
                  render={({ field, fieldState }) => (
                    <EditCatalogContactFieldRow
                      fieldConfig={fieldConfig}
                      controllerField={field}
                      disabled={disabled}
                      errorMessage={fieldState.error?.message}
                    />
                  )}
                />
              ))}
            </div>
          </DrawerScrollArea>

          <AppDrawer.Footer
            className="border-t"
            btnText="Готово"
            isFooterBtnDisabled={disabled || isSaving}
            buttonType="button"
          />
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
