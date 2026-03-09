"use client";

import {
  CATALOG_CONTACT_FIELDS,
  type CatalogEditFormValues,
} from "@/core/widgets/edit-catalog-drawer/model/form-config";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { Field, FieldContent, FieldError } from "@/shared/ui/field";
import {
  CatalogOwnerBipIcon,
  CatalogOwnerGeoIcon,
  CatalogOwnerMailIcon,
  CatalogOwnerMaxIcon,
  CatalogOwnerPhoneIcon,
  CatalogOwnerTgIcon,
  CatalogOwnerWaIcon,
} from "@/shared/ui/icons/catalog-owner-icons";
import { Input } from "@/shared/ui/input";
import { PhoneInput } from "@/shared/ui/phone-input";
import { ChevronRight, MessageCircle } from "lucide-react";
import React from "react";
import {
  Controller,
  useWatch,
  type ControllerRenderProps,
  type UseFormReturn,
} from "react-hook-form";

type CatalogContactFieldName = (typeof CATALOG_CONTACT_FIELDS)[number]["name"];

type EditCatalogContactsDrawerProps = {
  form: UseFormReturn<CatalogEditFormValues>;
  disabled?: boolean;
};

type ContactIconProps = {
  className?: string;
};

type ContactInputProps = Omit<
  React.ComponentProps<"input">,
  "defaultValue" | "onChange" | "type" | "value"
>;

const CONTACT_FIELD_NAMES = CATALOG_CONTACT_FIELDS.map((field) => field.name) as [
  CatalogContactFieldName,
  ...CatalogContactFieldName[],
];

const CONTACT_DRAWER_DESCRIPTION =
  "Обязательно укажите хотя бы один контакт. Внешние ссылки будут показаны внизу каталога, чтобы с вами было проще связаться.";

const CONTACT_ICON_BY_NAME: Record<
  CatalogContactFieldName,
  React.ComponentType<ContactIconProps>
> = {
  phone: CatalogOwnerPhoneIcon,
  message: ({ className }) => (
    <MessageCircle className={className} fill="currentColor" />
  ),
  email: CatalogOwnerMailIcon,
  whatsapp: CatalogOwnerWaIcon,
  telegram: CatalogOwnerTgIcon,
  bip: CatalogOwnerBipIcon,
  max: CatalogOwnerMaxIcon,
  map: CatalogOwnerGeoIcon,
};

function normalizeContactValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanPastedUrl(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }

  const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/i);
  const rawUrl = urlMatch?.[0] ?? trimmed;

  try {
    const url = new URL(rawUrl);
    return `${url.origin}${url.pathname}`.replace(/\/$/, "");
  } catch {
    return rawUrl;
  }
}

function getContactInputProps(
  field: (typeof CATALOG_CONTACT_FIELDS)[number],
): ContactInputProps | undefined {
  if (field.kind === "tel") {
    return {
      autoComplete: "tel",
      inputMode: "tel",
    };
  }

  if (field.kind === "email") {
    return {
      autoComplete: "email",
      inputMode: "email",
    };
  }

  if (field.kind === "url") {
    return {
      autoCapitalize: "none",
      autoCorrect: "off",
      inputMode: "url",
    };
  }

  if (field.name === "telegram") {
    return {
      autoCapitalize: "none",
      autoCorrect: "off",
    };
  }

  return undefined;
}

function ContactIconsPreview({
  values,
}: {
  values: Partial<Record<CatalogContactFieldName, string>>;
}) {
  const activeFields = CATALOG_CONTACT_FIELDS.filter((field) =>
    normalizeContactValue(values[field.name]).length > 0,
  );

  if (activeFields.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">
        Добавить контакты
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      {activeFields.map((field) => {
        const Icon = CONTACT_ICON_BY_NAME[field.name];

        return (
          <span
            key={field.name}
            className="text-muted-foreground inline-flex items-center justify-center"
            title={field.label}
          >
            <Icon className="size-[18px]" />
          </span>
        );
      })}
    </span>
  );
}

function ContactFieldRow({
  fieldConfig,
  controllerField,
  disabled,
  readOnly,
  errorMessage,
}: {
  fieldConfig: (typeof CATALOG_CONTACT_FIELDS)[number];
  controllerField: ControllerRenderProps<CatalogEditFormValues, CatalogContactFieldName>;
  disabled: boolean;
  readOnly: boolean;
  errorMessage?: string;
}) {
  const Icon = CONTACT_ICON_BY_NAME[fieldConfig.name];
  const inputProps = getContactInputProps(fieldConfig);

  return (
    <Field className="gap-0">
      <FieldContent>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <span className="text-muted-foreground shadow-custom inline-flex size-10 items-center justify-center rounded-full">
            <Icon className="size-[22px]" />
          </span>

          {fieldConfig.kind === "tel" ? (
            <PhoneInput
              value={
                controllerField.value === undefined || controllerField.value === null
                  ? ""
                  : String(controllerField.value)
              }
              onValueChange={controllerField.onChange}
              onBlur={() => controllerField.onBlur()}
              ref={(node) => {
                controllerField.ref(node);
              }}
              disabled={disabled}
              readOnly={readOnly}
              aria-invalid={errorMessage ? true : undefined}
              placeholder={fieldConfig.placeholder}
              className="border-muted-foreground h-fit rounded-none border-0 border-b px-0 pt-4 pb-4 shadow-none"
              {...inputProps}
            />
          ) : (
            <Input
              type={fieldConfig.kind === "text" ? "text" : fieldConfig.kind}
              value={
                controllerField.value === undefined || controllerField.value === null
                  ? ""
                  : String(controllerField.value)
              }
              onChange={(event) => controllerField.onChange(event.target.value)}
              onBlur={() => controllerField.onBlur()}
              ref={(node) => {
                controllerField.ref(node);
              }}
              disabled={disabled}
              readOnly={readOnly}
              aria-invalid={errorMessage ? true : undefined}
              placeholder={fieldConfig.placeholder}
              onPaste={
                fieldConfig.kind === "url"
                  ? (event) => {
                      const cleaned = cleanPastedUrl(
                        event.clipboardData.getData("text"),
                      );

                      if (!cleaned) {
                        return;
                      }

                      event.preventDefault();
                      controllerField.onChange(cleaned);
                    }
                  : undefined
              }
              className="border-muted-foreground h-fit rounded-none border-0 border-b px-0 pt-4 pb-4 shadow-none"
              {...inputProps}
            />
          )}
        </div>

        <FieldError
          className="pl-14"
          errors={errorMessage ? [{ message: errorMessage }] : undefined}
        />
      </FieldContent>
    </Field>
  );
}

export const EditCatalogContactsDrawer: React.FC<
  EditCatalogContactsDrawerProps
> = ({ form, disabled = false }) => {
  const watchedValues = useWatch({
    control: form.control,
    name: CONTACT_FIELD_NAMES,
  });

  const contactValues = React.useMemo(
    () =>
      CONTACT_FIELD_NAMES.reduce(
        (acc, fieldName, index) => {
          acc[fieldName] = typeof watchedValues?.[index] === "string"
            ? watchedValues[index]
            : "";
          return acc;
        },
        {} as Partial<Record<CatalogContactFieldName, string>>,
      ),
    [watchedValues],
  );

  const hasContacts = React.useMemo(
    () =>
      Object.values(contactValues).some(
        (value) => normalizeContactValue(value).length > 0,
      ),
    [contactValues],
  );

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
          <ContactIconsPreview values={contactValues} />
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
                    <ContactFieldRow
                      fieldConfig={fieldConfig}
                      controllerField={field}
                      disabled={disabled}
                      readOnly={false}
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
