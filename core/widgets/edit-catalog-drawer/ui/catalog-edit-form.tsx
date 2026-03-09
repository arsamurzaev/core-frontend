"use client";

import { type CatalogEditFormValues } from "@/core/widgets/edit-catalog-drawer/model/form-config";
import { CatalogEditMediaField } from "@/core/widgets/edit-catalog-drawer/ui/catalog-edit-media-field";
import { EditCatalogContactsDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-contacts-drawer";
import { CharacterLimitedTextarea } from "@/shared/ui/character-limited-textarea";
import { FieldError } from "@/shared/ui/field";
import React from "react";
import {
  Controller,
  type FieldError as RhfFieldError,
  type UseFormReturn,
} from "react-hook-form";

type CatalogEditFormProps = {
  form: UseFormReturn<CatalogEditFormValues>;
  disabled?: boolean;
  logoUrl?: string | null;
  bgUrl?: string | null;
};

type CatalogEditTextRowProps = {
  label: string;
  required?: boolean;
  error?: RhfFieldError;
  children: React.ReactNode;
};

function CatalogEditTextRow({
  label,
  required = false,
  error,
  children,
}: CatalogEditTextRowProps) {
  return (
    <div className="grid w-full grid-cols-[100px_minmax(0,1fr)] gap-x-5 gap-y-2 px-5 sm:grid-cols-[180px_minmax(0,1fr)]">
      <div className="pt-1 text-sm leading-6">
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </div>
      <div className="min-w-0">{children}</div>
      {error?.message ? (
        <FieldError className="col-start-2">{error.message}</FieldError>
      ) : null}
    </div>
  );
}

export const CatalogEditForm: React.FC<CatalogEditFormProps> = ({
  form,
  disabled = false,
  logoUrl,
  bgUrl,
}) => {
  return (
    <div className="flex w-full flex-col items-center space-y-4">
      <Controller
        control={form.control}
        name="logoFile"
        render={({ field }) => (
          <CatalogEditMediaField
            field={field}
            disabled={disabled}
            existingUrl={logoUrl}
            fallbackSrc="/default-avatar.png"
            shape="circle"
            aspectRatio={1}
            triggerText="Изменить главное фото"
            cropperTitle="Обрезка главного фото"
            cropperDescription="Подготовьте главное фото каталога перед сохранением."
            outputOptions={{
              maxWidth: 1400,
              maxHeight: 1400,
              quality: 0.92,
              mimeType: "image/jpeg",
              fileNameSuffix: "catalog-logo",
            }}
          />
        )}
      />

      <hr className="w-full" />

      <div className="!mt-0 flex w-full flex-col items-center justify-center gap-4 px-5">
        <Controller
          control={form.control}
          name="bgFile"
          render={({ field }) => (
            <CatalogEditMediaField
              field={field}
              disabled={disabled}
              existingUrl={bgUrl}
              fallbackSrc="/default-bg.png"
              shape="wide"
              aspectRatio={4 / 1}
              triggerText="Изменить задний фон"
              caption="размер изображения (соотношение 4:1)"
              cropperTitle="Обрезка заднего фона"
              cropperDescription="Подготовьте фоновое изображение каталога перед сохранением."
              outputOptions={{
                maxWidth: 2400,
                maxHeight: 1200,
                quality: 0.92,
                mimeType: "image/jpeg",
                fileNameSuffix: "catalog-background",
              }}
            />
          )}
        />
      </div>

      <hr className="w-full" />

      <div className="grid w-full gap-y-6">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <CatalogEditTextRow label="Имя" required error={fieldState.error}>
              <CharacterLimitedTextarea
                ref={field.ref}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                maxLength={35}
                minRows={2}
                placeholder="Например: Urban Style"
                disabled={disabled}
              />
            </CatalogEditTextRow>
          )}
        />

        <Controller
          control={form.control}
          name="about"
          render={({ field, fieldState }) => (
            <CatalogEditTextRow label="О себе" required error={fieldState.error}>
              <CharacterLimitedTextarea
                ref={field.ref}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                maxLength={100}
                minRows={2}
                placeholder="Например: магазин мебели, спа-салон"
                disabled={disabled}
              />
            </CatalogEditTextRow>
          )}
        />

        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <CatalogEditTextRow
              label="Общая информация"
              required
              error={fieldState.error}
            >
              <CharacterLimitedTextarea
                ref={field.ref}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                maxLength={500}
                minRows={4}
                placeholder="Например: г. Грозный, ул. Назарбаева 5. График работы: 10:00 до 18:00."
                disabled={disabled}
              />
            </CatalogEditTextRow>
          )}
        />

        <CatalogEditTextRow
          label="Контакты"
          required
          error={form.formState.errors.phone}
        >
          <EditCatalogContactsDrawer form={form} disabled={disabled} />
        </CatalogEditTextRow>
      </div>
    </div>
  );
};
