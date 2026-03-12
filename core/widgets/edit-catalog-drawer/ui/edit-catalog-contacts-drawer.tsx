"use client";

import {
  CONTACT_DRAWER_DESCRIPTION,
} from "@/core/widgets/edit-catalog-drawer/model/edit-catalog-contacts";
import { useEditCatalogContactValues } from "@/core/widgets/edit-catalog-drawer/model/use-edit-catalog-contact-values";
import {
  CATALOG_CONTACT_FIELDS,
  type CatalogEditFormValues,
} from "@/core/widgets/edit-catalog-drawer/model/form-config";
import { EditCatalogContactFieldRow } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-contact-field-row";
import { EditCatalogContactIconsPreview } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-contact-icons-preview";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { ChevronRight } from "lucide-react";
import React from "react";
import { Controller, type UseFormReturn } from "react-hook-form";

type EditCatalogContactsDrawerProps = {
  form: UseFormReturn<CatalogEditFormValues>;
  disabled?: boolean;
};

export const EditCatalogContactsDrawer: React.FC<
  EditCatalogContactsDrawerProps
> = ({ form, disabled = false }) => {
  const { contactValues, hasContacts } = useEditCatalogContactValues(form);

  return (
    <AppDrawer
      dismissible={!disabled}
      trigger={
        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground h-auto w-full justify-between px-0 py-0 hover:bg-transparent"
          disabled={disabled}
        >
          <EditCatalogContactIconsPreview values={contactValues} />
          <span className="ml-3 inline-flex items-center gap-2 text-sm">
            {hasContacts ? "Изменить контакты" : "Добавить контакты"}
            <ChevronRight className="size-4" />
          </span>
        </Button>
      }
    >
      <AppDrawer.Content className="mx-auto w-full max-w-xl">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Контакты"
            description={CONTACT_DRAWER_DESCRIPTION}
            withCloseButton={!disabled}
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
            buttonType="button"
          />
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
