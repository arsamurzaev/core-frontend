"use client";

import { type CatalogEditFormValues } from "@/core/widgets/edit-catalog-drawer/model/form-config";
import {
  CatalogEditMediaController,
  type CatalogEditMediaControllerConfig,
} from "@/core/widgets/edit-catalog-drawer/ui/catalog-edit-media-controller";
import {
  CatalogEditTextareaController,
  type CatalogEditTextareaControllerConfig,
} from "@/core/widgets/edit-catalog-drawer/ui/catalog-edit-textarea-controller";
import { EditCatalogAdvancedSettingsDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-advanced-settings-drawer";
import { EditCatalogCheckoutDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-checkout-drawer";
import { EditCatalogContactsDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-contacts-drawer";
import { EditCatalogExperienceDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-experience-drawer";
import type { CheckoutConfig } from "@/shared/lib/checkout-methods";
import { FieldError } from "@/shared/ui/field";
import React from "react";
import { type UseFormReturn } from "react-hook-form";

type CatalogEditFormProps = {
  form: UseFormReturn<CatalogEditFormValues>;
  checkoutConfig?: CheckoutConfig;
  disabled?: boolean;
  isSaving?: boolean;
  logoUrl?: string | null;
  bgUrl?: string | null;
  onSave?: () => Promise<boolean>;
};

const CATALOG_EDIT_TEXTAREA_FIELDS: CatalogEditTextareaControllerConfig[] = [
  {
    name: "name",
    label: "Имя",
    required: true,
    maxLength: 35,
    minRows: 2,
    placeholder: "Например: Urban Style",
  },
  {
    name: "about",
    label: "О себе",
    required: true,
    maxLength: 100,
    minRows: 2,
    placeholder: "Например: магазин мебели, спа-салон",
  },
  {
    name: "description",
    label: "Общая информация",
    required: true,
    maxLength: 500,
    minRows: 4,
    placeholder:
      "Например: г. Грозный, ул. Назарбаева 5. График работы: 10:00 до 18:00.",
  },
  {
    name: "address",
    label: "Адрес заведения",
    required: false,
    maxLength: 500,
    minRows: 2,
    placeholder: "Например: г. Грозный, ул. Назарбаева 5",
  },
];

function buildCatalogEditMediaFields(params: {
  bgUrl?: string | null;
  logoUrl?: string | null;
}): CatalogEditMediaControllerConfig[] {
  return [
    {
      name: "logoFile",
      existingUrl: params.logoUrl,
      fallbackSrc: "/default-avatar.png",
      shape: "circle",
      aspectRatio: 1,
      triggerText: "Изменить главное фото",
      cropperTitle: "Обрезка главного фото",
      cropperDescription:
        "Подготовьте главное фото каталога перед сохранением.",
      outputOptions: {
        maxWidth: 1400,
        maxHeight: 1400,
        quality: 0.92,
        mimeType: "image/jpeg",
        fileNameSuffix: "catalog-logo",
      },
    },
    {
      name: "bgFile",
      existingUrl: params.bgUrl,
      fallbackSrc: "/default-bg.png",
      shape: "wide",
      aspectRatio: 4 / 1,
      triggerText: "Изменить задний фон",
      caption: "размер изображения (соотношение 4:1)",
      cropperTitle: "Обрезка заднего фона",
      cropperDescription:
        "Подготовьте фоновое изображение каталога перед сохранением.",
      outputOptions: {
        maxWidth: 2400,
        maxHeight: 1200,
        quality: 0.92,
        mimeType: "image/jpeg",
        fileNameSuffix: "catalog-background",
      },
    },
  ];
}

function CatalogEditTextRow({
  children,
  errorMessage,
  label,
  required = false,
}: {
  children: React.ReactNode;
  errorMessage?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="grid w-full grid-cols-1 gap-x-5 gap-y-2 px-5 sm:grid-cols-[180px_minmax(0,1fr)]">
      <div className="min-w-0 pt-1 text-sm leading-6">
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </div>
      <div className="min-w-0">{children}</div>
      {errorMessage ? (
        <FieldError className="sm:col-start-2">{errorMessage}</FieldError>
      ) : null}
    </div>
  );
}

export const CatalogEditForm: React.FC<CatalogEditFormProps> = ({
  form,
  checkoutConfig,
  disabled = false,
  isSaving = false,
  logoUrl,
  bgUrl,
  onSave,
}) => {
  const mediaFields = React.useMemo(
    () => buildCatalogEditMediaFields({ bgUrl, logoUrl }),
    [bgUrl, logoUrl],
  );

  return (
    <div className="flex w-full flex-col items-center space-y-4">
      <CatalogEditMediaController
        config={mediaFields[0]}
        disabled={disabled}
        form={form}
      />

      <hr className="w-full" />

      <div className="!mt-0 flex w-full flex-col items-center justify-center gap-4 px-5">
        <CatalogEditMediaController
          config={mediaFields[1]}
          disabled={disabled}
          form={form}
        />
      </div>

      <hr className="w-full" />

      <div className="grid w-full gap-y-6">
        {CATALOG_EDIT_TEXTAREA_FIELDS.map((fieldConfig) => (
          <CatalogEditTextareaController
            key={fieldConfig.name}
            config={fieldConfig}
            disabled={disabled}
            form={form}
          />
        ))}

        <CatalogEditTextRow
          label="Контакты"
          required
          errorMessage={form.formState.errors.phone?.message}
        >
          <EditCatalogContactsDrawer
            form={form}
            disabled={disabled}
            isSaving={isSaving}
            onSave={onSave}
          />
        </CatalogEditTextRow>

        <CatalogEditTextRow
          label="Способ заказа"
          required
          errorMessage={form.formState.errors.checkoutEnabledMethods?.message}
        >
          <EditCatalogCheckoutDrawer
            form={form}
            checkoutConfig={checkoutConfig}
            disabled={disabled}
            isSaving={isSaving}
            onSave={onSave}
          />
        </CatalogEditTextRow>

        <CatalogEditTextRow
          label="Сценарий заказа"
          required
          errorMessage={
            form.formState.errors.allowedModes?.message ??
            form.formState.errors.defaultMode?.message
          }
        >
          <EditCatalogExperienceDrawer
            form={form}
            disabled={disabled}
            isSaving={isSaving}
            onSave={onSave}
          />
        </CatalogEditTextRow>
      </div>

      <hr className="w-full" />

      <div className="w-full px-5">
        <EditCatalogAdvancedSettingsDrawer disabled={disabled} />
      </div>
    </div>
  );
};
