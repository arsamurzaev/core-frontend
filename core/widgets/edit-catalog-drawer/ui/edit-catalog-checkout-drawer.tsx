"use client";

import { type CatalogEditFormValues } from "@/core/widgets/edit-catalog-drawer/model/form-config";
import { CatalogContactDtoType } from "@/shared/api/generated/react-query";
import {
  CHECKOUT_CONTACT_TYPES,
  CHECKOUT_METHOD_DESCRIPTIONS,
  CHECKOUT_METHOD_LABELS,
  getCatalogCheckoutConfig,
  type CheckoutConfig,
  type CheckoutContactValues,
  type CheckoutMethod,
} from "@/shared/lib/checkout-methods";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { FieldError } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { PhoneInput } from "@/shared/ui/phone-input";
import { Switch } from "@/shared/ui/switch";
import { ChevronRight } from "lucide-react";
import React from "react";
import { Controller, type UseFormReturn, useWatch } from "react-hook-form";

type EditCatalogCheckoutDrawerProps = {
  form: UseFormReturn<CatalogEditFormValues>;
  checkoutConfig?: CheckoutConfig;
  disabled?: boolean;
  isSaving?: boolean;
  onSave?: () => Promise<boolean>;
};

const CHECKOUT_CONTACT_FORM_FIELDS: Partial<
  Record<CatalogContactDtoType, keyof CatalogEditFormValues>
> = {
  [CatalogContactDtoType.PHONE]: "phone",
  [CatalogContactDtoType.WHATSAPP]: "whatsapp",
  [CatalogContactDtoType.SMS]: "message",
  [CatalogContactDtoType.TELEGRAM]: "telegram",
  [CatalogContactDtoType.BIP]: "bip",
  [CatalogContactDtoType.MAX]: "max",
};

function getContactLabel(type: CatalogContactDtoType): string {
  switch (type) {
    case CatalogContactDtoType.PHONE:
      return "Телефон";
    case CatalogContactDtoType.WHATSAPP:
      return "WhatsApp";
    case CatalogContactDtoType.SMS:
      return "SMS";
    case CatalogContactDtoType.TELEGRAM:
      return "Telegram";
    case CatalogContactDtoType.BIP:
      return "Bip";
    case CatalogContactDtoType.MAX:
      return "MAX";
    default:
      return type;
  }
}

function getContactPlaceholder(type: CatalogContactDtoType): string {
  if (
    type === CatalogContactDtoType.PHONE ||
    type === CatalogContactDtoType.WHATSAPP ||
    type === CatalogContactDtoType.SMS
  ) {
    return "+7...";
  }

  if (type === CatalogContactDtoType.TELEGRAM) {
    return "@nickname";
  }

  return "https://...";
}

function isPhoneContactType(type: CatalogContactDtoType): boolean {
  return (
    type === CatalogContactDtoType.PHONE ||
    type === CatalogContactDtoType.WHATSAPP ||
    type === CatalogContactDtoType.SMS
  );
}

function MethodContactsEditor({
  disabled,
  form,
  method,
}: {
  disabled: boolean;
  form: UseFormReturn<CatalogEditFormValues>;
  method: CheckoutMethod;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-black/10 p-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">Контакты для способа</p>
        <p className="text-xs text-muted-foreground">
          Если оставить пустыми, будут использоваться контакты каталога.
        </p>
      </div>

      <div className="grid gap-3">
        {CHECKOUT_CONTACT_TYPES.map((type) => (
          <Controller
            key={`${method}-${type}`}
            control={form.control}
            name={`checkoutContacts.${method}.${type}` as never}
            render={({ field }) => {
              const value = typeof field.value === "string" ? field.value : "";

              return (
                <label className="grid gap-1 text-sm">
                  <span className="text-muted-foreground">
                    {getContactLabel(type)}
                  </span>
                  {isPhoneContactType(type) ? (
                    <PhoneInput
                      value={value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      disabled={disabled}
                      placeholder={getContactPlaceholder(type)}
                      className="border border-black/10"
                    />
                  ) : (
                    <Input
                      value={value}
                      onChange={(event) => field.onChange(event.target.value)}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      disabled={disabled}
                      placeholder={getContactPlaceholder(type)}
                      className="border border-black/10"
                    />
                  )}
                </label>
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}

function getMethodContactsCount(
  contacts: Partial<Record<CheckoutMethod, CheckoutContactValues>> | undefined,
  method: CheckoutMethod,
): number {
  return Object.values(contacts?.[method] ?? {}).filter(
    (value) => typeof value === "string" && value.trim().length > 0,
  ).length;
}

function getGeneralCheckoutContacts(
  form: UseFormReturn<CatalogEditFormValues>,
): CheckoutContactValues {
  return CHECKOUT_CONTACT_TYPES.reduce<CheckoutContactValues>((acc, type) => {
    const fieldName = CHECKOUT_CONTACT_FORM_FIELDS[type];
    const value = fieldName ? form.getValues(fieldName) : "";

    if (typeof value === "string" && value.trim().length > 0) {
      acc[type] = value;
    }

    return acc;
  }, {});
}

function mergeGeneralContactsIntoCheckoutMethods(params: {
  checkout: CheckoutConfig;
  form: UseFormReturn<CatalogEditFormValues>;
}) {
  const generalContacts = getGeneralCheckoutContacts(params.form);

  if (Object.keys(generalContacts).length === 0) {
    return;
  }

  const currentContacts = params.form.getValues("checkoutContacts") ?? {};
  let hasChanges = false;
  const nextContacts: Partial<Record<CheckoutMethod, CheckoutContactValues>> = {
    ...currentContacts,
  };

  for (const method of params.checkout.availableMethods) {
    const methodContacts = { ...(currentContacts[method] ?? {}) };

    for (const type of CHECKOUT_CONTACT_TYPES) {
      const currentValue = methodContacts[type];
      const generalValue = generalContacts[type];

      if (
        (!currentValue || currentValue.trim().length === 0) &&
        generalValue
      ) {
        methodContacts[type] = generalValue;
        hasChanges = true;
      }
    }

    nextContacts[method] = methodContacts;
  }

  if (hasChanges) {
    params.form.setValue("checkoutContacts", nextContacts, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }
}

export const EditCatalogCheckoutDrawer: React.FC<
  EditCatalogCheckoutDrawerProps
> = ({ form, checkoutConfig, disabled = false, isSaving = false, onSave }) => {
  const [open, setOpen] = React.useState(false);
  const catalog = useCatalog();
  const checkout = React.useMemo(
    () => checkoutConfig ?? getCatalogCheckoutConfig(catalog),
    [catalog, checkoutConfig],
  );
  const watchedEnabledMethods = useWatch({
    control: form.control,
    name: "checkoutEnabledMethods",
  });
  const enabledMethods = React.useMemo(
    () => watchedEnabledMethods ?? [],
    [watchedEnabledMethods],
  );
  const contacts = useWatch({ control: form.control, name: "checkoutContacts" });

  const summary = React.useMemo(() => {
    const labels = enabledMethods.map((method) => CHECKOUT_METHOD_LABELS[method]);
    if (labels.length === 0) {
      return "Способы выключены";
    }

    return labels.length ? labels.join(", ") : "Настроить способы";
  }, [enabledMethods]);
  const summaryDescription = React.useMemo(() => {
    if (enabledMethods.length === 0) {
      return "Включите нужные способы заказа и контакты для них.";
    }

    return "Способы заказа и отдельные контакты для выбранных сценариев.";
  }, [enabledMethods.length]);

  const handleMethodToggle = React.useCallback(
    (method: CheckoutMethod, checked: boolean) => {
      const current = new Set(form.getValues("checkoutEnabledMethods"));
      if (checked) {
        current.add(method);
      } else {
        current.delete(method);
      }

      const next = checkout.availableMethods.filter((item) => current.has(item));
      form.setValue("checkoutEnabledMethods", next, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [checkout.availableMethods, form],
  );
  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      if (nextOpen) {
        mergeGeneralContactsIntoCheckoutMethods({ checkout, form });
      }
    },
    [checkout, form],
  );
  const handleSave = React.useCallback(async () => {
    const isSaved = await onSave?.();
    if (isSaved) {
      setOpen(false);
    }
  }, [onSave]);

  return (
    <AppDrawer
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
              <Badge
                variant="secondary"
                className="max-w-full wrap-break-word text-left whitespace-normal"
              >
                {summary}
              </Badge>
            </div>
            <p className="mt-1 wrap-break-word text-sm text-muted-foreground whitespace-normal">
              {summaryDescription}
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      }
    >
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Способы заказа"
            description="Включите доступные способы заказа и задайте отдельные контакты для каждого сценария."
            withCloseButton={!disabled && !isSaving}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="space-y-5">
              <section className="space-y-3">
                {checkout.availableMethods.map((method) => {
                  const isEnabled = enabledMethods.includes(method);
                  const customContactsCount = getMethodContactsCount(
                    contacts,
                    method,
                  );

                  return (
                    <div
                      key={method}
                      className="space-y-3 rounded-2xl border border-black/10 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <Switch
                          checked={isEnabled}
                          disabled={disabled}
                          onCheckedChange={(checked) =>
                            handleMethodToggle(method, checked)
                          }
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">
                            {CHECKOUT_METHOD_LABELS[method]}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {CHECKOUT_METHOD_DESCRIPTIONS[method]}
                          </p>
                          {customContactsCount > 0 ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Кастомных контактов: {customContactsCount}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {isEnabled ? (
                        <MethodContactsEditor
                          disabled={disabled}
                          form={form}
                          method={method}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </section>

              <FieldError>
                {form.formState.errors.checkoutEnabledMethods?.message}
              </FieldError>
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
