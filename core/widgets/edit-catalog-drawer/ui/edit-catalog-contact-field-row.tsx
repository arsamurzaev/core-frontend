"use client";

import {
  cleanPastedCatalogContactUrl,
  CONTACT_ICON_BY_NAME,
  getCatalogContactInputProps,
  type CatalogContactFieldConfig,
  type CatalogContactFieldName,
} from "@/core/widgets/edit-catalog-drawer/model/edit-catalog-contacts";
import { type CatalogEditFormValues } from "@/core/widgets/edit-catalog-drawer/model/form-config";
import { Field, FieldContent, FieldError } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { PhoneInput } from "@/shared/ui/phone-input";
import React from "react";
import { type ControllerRenderProps } from "react-hook-form";

type EditCatalogContactFieldRowProps = {
  controllerField: ControllerRenderProps<
    CatalogEditFormValues,
    CatalogContactFieldName
  >;
  disabled: boolean;
  errorMessage?: string;
  fieldConfig: CatalogContactFieldConfig;
  readOnly?: boolean;
};

function getControllerFieldValue(
  value: ControllerRenderProps<
    CatalogEditFormValues,
    CatalogContactFieldName
  >["value"],
): string {
  return value === undefined || value === null ? "" : String(value);
}

export const EditCatalogContactFieldRow: React.FC<
  EditCatalogContactFieldRowProps
> = ({
  controllerField,
  disabled,
  errorMessage,
  fieldConfig,
  readOnly = false,
}) => {
  const Icon = CONTACT_ICON_BY_NAME[fieldConfig.name];
  const inputProps = getCatalogContactInputProps(fieldConfig);

  return (
    <Field className="gap-0">
      <FieldContent>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <span className="text-muted-foreground shadow-custom inline-flex size-10 items-center justify-center rounded-full">
            <Icon className="size-[22px]" />
          </span>

          {fieldConfig.kind === "tel" ? (
            <PhoneInput
              value={getControllerFieldValue(controllerField.value)}
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
              value={getControllerFieldValue(controllerField.value)}
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
                      const cleaned = cleanPastedCatalogContactUrl(
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
};
