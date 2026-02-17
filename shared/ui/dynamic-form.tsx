"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import {
  Controller,
  FormProvider,
  useForm,
  type DefaultValues,
  type FieldErrors,
  type FieldValues,
  type Path,
  type Resolver,
  type FieldError as RhfFieldError,
  type UseFormReturn,
} from "react-hook-form";
import { z } from "zod";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { CharacterLimitedTextarea } from "@/shared/ui/character-limited-textarea";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Select } from "@/shared/ui/select";
import { Slider } from "@/shared/ui/slider";
import { Switch } from "@/shared/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";

type FieldOptionValue = string | number;

export type FieldOption = {
  label: React.ReactNode;
  value: FieldOptionValue;
  disabled?: boolean;
  description?: React.ReactNode;
};

export type FieldLayout = {
  colSpan?: number;
  rowSpan?: number;
  colStart?: number;
  rowStart?: number;
  order?: number;
  area?: string;
  className?: string;
  style?: React.CSSProperties;
};

type ZodSchema = z.core.$ZodType;
type ZodShape = z.core.$ZodShape;
type CharacterLimitedTextareaProps = React.ComponentProps<
  typeof CharacterLimitedTextarea
>;
type DynamicTextareaProps = Omit<
  CharacterLimitedTextareaProps,
  "maxLength" | "value" | "onChange" | "ref"
> & {
  maxLength?: number;
  rows?: number;
  forceShowCounter?: boolean;
};

export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "password"
  | "tel"
  | "url"
  | "color"
  | "date"
  | "date-input"
  | "datetime"
  | "time"
  | "checkbox"
  | "checkbox-group"
  | "switch"
  | "select"
  | "radio"
  | "slider"
  | "toggle-group"
  | "hidden";

export type DynamicFieldConfig<TValues extends FieldValues = FieldValues> = {
  name: Path<TValues>;
  label?: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: string;
  kind?: FieldKind;
  options?: FieldOption[];
  orientation?: "vertical" | "horizontal" | "responsive";
  layout?: FieldLayout;
  disabled?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  required?: boolean;
  multiple?: boolean;
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  rows?: number;
  showValue?: boolean;
  allowClear?: boolean;
  dateFormat?: string;
  inputProps?: React.ComponentProps<"input">;
  textareaProps?: DynamicTextareaProps;
  selectProps?: React.ComponentProps<"select">;
  checkboxProps?: React.ComponentProps<typeof Checkbox>;
  switchProps?: React.ComponentProps<typeof Switch>;
  radioGroupProps?: React.ComponentProps<typeof RadioGroup>;
  sliderProps?: React.ComponentProps<typeof Slider>;
  toggleGroupProps?: React.ComponentProps<typeof ToggleGroup>;
  calendarProps?: React.ComponentProps<typeof Calendar>;
  render?: (props: DynamicFieldRenderProps<TValues>) => React.ReactNode;
  component?: React.ComponentType<DynamicFieldRenderProps<TValues>>;
  hideLabel?: boolean;
  hideDescription?: boolean;
  hideError?: boolean;
  className?: string;
  controlClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  errorClassName?: string;
  schema?: ZodSchema;
};

export type DynamicFieldRenderProps<TValues extends FieldValues = FieldValues> =
  {
    name: Path<TValues>;
    id: string;
    label?: React.ReactNode;
    description?: React.ReactNode;
    placeholder?: string;
    required: boolean;
    disabled: boolean;
    readOnly: boolean;
    options?: FieldOption[];
    kind: FieldKind;
    errors: Array<{ message?: string } | undefined>;
    field: {
      value: unknown;
      onChange: (...event: Array<unknown>) => void;
      onBlur: () => void;
      name: string;
      ref: React.Ref<unknown>;
    };
    form: UseFormReturn<TValues, unknown, TValues>;
    fieldConfig: DynamicFieldConfig<TValues>;
  };

export type DynamicFormLayout = {
  variant?: "grid" | "stack";
  columns?: number;
  className?: string;
  groupClassName?: string;
  style?: React.CSSProperties;
};

type SchemaValues<Schema extends ZodSchema> =
  z.output<Schema> extends FieldValues ? z.output<Schema> : FieldValues;

export type DynamicFormProps<Schema extends ZodSchema> = {
  schema: Schema;
  fields?: DynamicFieldConfig<SchemaValues<Schema>>[];
  fieldOverrides?: Record<
    string,
    Partial<DynamicFieldConfig<SchemaValues<Schema>>>
  >;
  defaultValues?: DefaultValues<SchemaValues<Schema>>;
  onSubmit: (values: SchemaValues<Schema>) => void | Promise<void>;
  onInvalid?: (errors: FieldErrors<SchemaValues<Schema>>) => void;
  form?: UseFormReturn<SchemaValues<Schema>, unknown, SchemaValues<Schema>>;
  layout?: DynamicFormLayout;
  disabled?: boolean;
  readOnly?: boolean;
  showOptionalLabel?: boolean;
  disableWhileSubmitting?: boolean;
  className?: string;
  fieldSetProps?: React.ComponentProps<typeof FieldSet>;
  fieldGroupProps?: React.ComponentProps<typeof FieldGroup>;
  actions?: React.ReactNode;
};

type ZodUnwrapResult = {
  schema: ZodSchema;
  isOptional: boolean;
  isNullable: boolean;
};

type ZodDefLike = {
  type?: string;
  innerType?: ZodSchema;
  in?: ZodSchema;
  shape?: ZodShape | (() => ZodShape);
  checks?: unknown[];
};

type ZodConstructor = new (...args: never[]) => ZodSchema;

const GRID_FALLBACK_COLUMNS = 1;
const DEFAULT_TEXTAREA_MAX_LENGTH = 500;

type CalendarSingleProps = Omit<
  React.ComponentProps<typeof Calendar>,
  "mode" | "selected" | "onSelect"
> & {
  mode: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
};

const CalendarSingle = Calendar as React.ComponentType<CalendarSingleProps>;

function getZodDef(schema: ZodSchema): ZodDefLike | undefined {
  const anySchema = schema as {
    _def?: ZodDefLike;
    def?: ZodDefLike;
    _zod?: { def?: ZodDefLike };
  };
  return anySchema._def ?? anySchema.def ?? anySchema._zod?.def;
}

function safeInstanceof<T extends ZodSchema>(
  value: unknown,
  ctor: unknown,
): value is T {
  return (
    typeof ctor === "function" && value instanceof (ctor as ZodConstructor)
  );
}

function isZodEnum(schema: ZodSchema): schema is z.ZodEnum<z.util.EnumLike> {
  return safeInstanceof(schema, (z as { ZodEnum?: unknown }).ZodEnum);
}

function unwrapZodType(schema: ZodSchema): ZodUnwrapResult {
  let current = schema;
  let isOptional = false;
  let isNullable = false;
  const visited = new Set<ZodSchema>();

  while (current && !visited.has(current)) {
    visited.add(current);
    const optionalCheck = (current as { isOptional?: () => boolean })
      .isOptional;
    if (typeof optionalCheck === "function") {
      isOptional = isOptional || optionalCheck();
    }
    const nullableCheck = (current as { isNullable?: () => boolean })
      .isNullable;
    if (typeof nullableCheck === "function") {
      isNullable = isNullable || nullableCheck();
    }

    const def = getZodDef(current);
    const type = def?.type;

    if (safeInstanceof(current, z.ZodOptional) || type === "optional") {
      const unwrap = (current as { unwrap?: () => ZodSchema }).unwrap;
      const inner = def?.innerType ?? (unwrap ? unwrap() : undefined);
      if (inner) {
        current = inner;
        continue;
      }
    }

    if (safeInstanceof(current, z.ZodNullable) || type === "nullable") {
      const unwrap = (current as { unwrap?: () => ZodSchema }).unwrap;
      const inner = def?.innerType ?? (unwrap ? unwrap() : undefined);
      if (inner) {
        current = inner;
        continue;
      }
    }

    if (safeInstanceof(current, z.ZodDefault) || type === "default") {
      const unwrap = (current as { unwrap?: () => ZodSchema }).unwrap;
      const inner = def?.innerType ?? (unwrap ? unwrap() : undefined);
      if (inner) {
        current = inner;
        continue;
      }
    }

    if (safeInstanceof(current, z.ZodCatch) || type === "catch") {
      const unwrap = (current as { unwrap?: () => ZodSchema }).unwrap;
      const inner = def?.innerType ?? (unwrap ? unwrap() : undefined);
      if (inner) {
        current = inner;
        continue;
      }
    }

    if (type === "pipe" && def?.in) {
      current = def.in as ZodSchema;
      continue;
    }

    break;
  }

  return { schema: current, isOptional, isNullable };
}

function getZodShape(schema: ZodSchema): ZodShape | null {
  const unwrapped = unwrapZodType(schema).schema;
  if (safeInstanceof(unwrapped, z.ZodObject)) {
    const def = getZodDef(unwrapped);
    const shapeValue =
      def?.shape ??
      (unwrapped as { shape?: ZodShape | (() => ZodShape) }).shape;
    if (typeof shapeValue === "function") return shapeValue();
    return shapeValue ?? null;
  }
  return null;
}

function humanizeLabel(value: string): string {
  const withSpaces = value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function getErrorByPath<TValues extends FieldValues>(
  errors: FieldErrors<TValues>,
  path: Path<TValues>,
): RhfFieldError | undefined {
  const segments = String(path).split(".");
  let current: unknown = errors;
  for (const segment of segments) {
    if (!current) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current as RhfFieldError | undefined;
}

function normalizeFieldErrors(
  error?: RhfFieldError,
): Array<{ message?: string }> {
  if (!error) return [];
  if (error.types) {
    const messages = Object.values(error.types)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter(Boolean)
      .map((message) => ({ message: String(message) }));
    if (messages.length) return messages;
  }

  if (error.message) {
    return [{ message: error.message }];
  }

  return [];
}
function getStringConstraints(schema: ZodSchema): {
  minLength?: number;
  maxLength?: number;
  format?: string | null;
} {
  const anySchema = schema as {
    minLength?: number | null;
    maxLength?: number | null;
    format?: string | null;
  };
  if (
    typeof anySchema.minLength === "number" ||
    typeof anySchema.maxLength === "number"
  ) {
    return {
      minLength: anySchema.minLength ?? undefined,
      maxLength: anySchema.maxLength ?? undefined,
      format: anySchema.format ?? null,
    };
  }

  const def = getZodDef(schema);
  const checks = (def?.checks ?? []) as Array<{
    kind?: string;
    value?: number;
    format?: string;
  }>;
  let minLength: number | undefined;
  let maxLength: number | undefined;
  let format: string | null | undefined;

  for (const check of checks) {
    if (check.kind === "min") minLength = check.value;
    if (check.kind === "max") maxLength = check.value;
    if (
      check.kind === "email" ||
      check.kind === "url" ||
      check.kind === "datetime"
    ) {
      format = check.kind;
    }
  }

  return {
    minLength,
    maxLength,
    format,
  };
}

function getNumberConstraints(schema: ZodSchema): {
  min?: number;
  max?: number;
  isInt?: boolean;
} {
  const anySchema = schema as {
    minValue?: number | null;
    maxValue?: number | null;
    isInt?: boolean;
  };
  if (
    typeof anySchema.minValue === "number" ||
    typeof anySchema.maxValue === "number"
  ) {
    return {
      min: anySchema.minValue ?? undefined,
      max: anySchema.maxValue ?? undefined,
      isInt: Boolean(anySchema.isInt),
    };
  }

  const def = getZodDef(schema);
  const checks = (def?.checks ?? []) as Array<{
    kind?: string;
    value?: number;
    inclusive?: boolean;
  }>;
  let min: number | undefined;
  let max: number | undefined;
  let isInt = false;

  for (const check of checks) {
    if (check.kind === "min" || check.kind === "greater") min = check.value;
    if (check.kind === "max" || check.kind === "less") max = check.value;
    if (check.kind === "int") isInt = true;
  }

  return { min, max, isInt };
}

function getDateConstraints(schema: ZodSchema): {
  minDate?: Date;
  maxDate?: Date;
} {
  const anySchema = schema as { minDate?: Date | null; maxDate?: Date | null };
  if (anySchema.minDate || anySchema.maxDate) {
    return {
      minDate: anySchema.minDate ?? undefined,
      maxDate: anySchema.maxDate ?? undefined,
    };
  }

  const def = getZodDef(schema);
  const checks = (def?.checks ?? []) as Array<{ kind?: string; value?: Date }>;
  let minDate: Date | undefined;
  let maxDate: Date | undefined;

  for (const check of checks) {
    if (check.kind === "min" || check.kind === "greater") minDate = check.value;
    if (check.kind === "max" || check.kind === "less") maxDate = check.value;
  }

  return { minDate, maxDate };
}

function inferFieldKind(schema: ZodSchema): FieldKind {
  if (safeInstanceof(schema, z.ZodString)) {
    const { format } = getStringConstraints(schema);
    if (format === "email") return "email";
    if (format === "url") return "url";
    if (format === "e164") return "tel";
    if (format === "datetime") return "datetime";
    if (format === "date") return "date-input";
    if (format === "time") return "time";
    return "text";
  }

  if (safeInstanceof(schema, z.ZodNumber)) return "number";
  if (safeInstanceof(schema, z.ZodBoolean)) return "switch";
  if (safeInstanceof(schema, z.ZodDate)) return "date";
  if (isZodEnum(schema)) return "select";

  if (safeInstanceof(schema, z.ZodArray)) {
    const element = (schema as z.ZodArray<ZodSchema>).element;
    const inner = unwrapZodType(element).schema;
    if (isZodEnum(inner)) {
      return "checkbox-group";
    }
  }

  return "text";
}

function inferOptions(schema: ZodSchema): FieldOption[] | undefined {
  if (isZodEnum(schema)) {
    const entries =
      (
        schema as {
          options?: string[];
          enum?: Record<string, string | number>;
        }
      ).options ??
      Object.values(
        (schema as { enum?: Record<string, string | number> }).enum ?? {},
      );
    return entries.map((value) => ({
      value,
      label: humanizeLabel(String(value)),
    }));
  }

  if (safeInstanceof(schema, z.ZodArray)) {
    const element = (schema as z.ZodArray<ZodSchema>).element;
    return inferOptions(unwrapZodType(element).schema);
  }

  return undefined;
}

function mergeFieldOverrides<TValues extends FieldValues>(
  fields: DynamicFieldConfig<TValues>[],
  overrides?: Record<string, Partial<DynamicFieldConfig<TValues>>>,
): DynamicFieldConfig<TValues>[] {
  if (!overrides) return fields;
  return fields.map((field) => {
    const override = overrides[String(field.name)];
    if (!override) return field;
    return {
      ...field,
      ...override,
      layout: { ...field.layout, ...override.layout },
      inputProps: { ...field.inputProps, ...override.inputProps },
      textareaProps: { ...field.textareaProps, ...override.textareaProps },
      selectProps: { ...field.selectProps, ...override.selectProps },
      checkboxProps: { ...field.checkboxProps, ...override.checkboxProps },
      switchProps: { ...field.switchProps, ...override.switchProps },
      radioGroupProps: {
        ...field.radioGroupProps,
        ...override.radioGroupProps,
      },
      sliderProps: { ...field.sliderProps, ...override.sliderProps },
      toggleGroupProps:
        field.toggleGroupProps || override.toggleGroupProps
          ? ({
              ...(field.toggleGroupProps ?? {}),
              ...(override.toggleGroupProps ?? {}),
            } as DynamicFieldConfig<TValues>["toggleGroupProps"])
          : undefined,
      calendarProps: { ...field.calendarProps, ...override.calendarProps },
    };
  });
}
function normalizeFields<TValues extends FieldValues>(
  fields: DynamicFieldConfig<TValues>[],
  schemaMap: Record<string, ZodSchema | undefined>,
): DynamicFieldConfig<TValues>[] {
  return fields.map((field) => {
    const schema = field.schema ?? schemaMap[String(field.name)];
    const unwrapped = schema ? unwrapZodType(schema) : null;
    const inferredKind =
      field.kind ?? (unwrapped ? inferFieldKind(unwrapped.schema) : "text");
    const required =
      field.required ?? (unwrapped ? !unwrapped.isOptional : false);
    const schemaDescription = (
      schema as { description?: string } | undefined
    )?.description;
    const description = field.description ?? schemaDescription;
    const options =
      field.options ?? (unwrapped ? inferOptions(unwrapped.schema) : undefined);

    const stringConstraints =
      unwrapped && safeInstanceof(unwrapped.schema, z.ZodString)
        ? getStringConstraints(unwrapped.schema)
        : {};
    const numberConstraints =
      unwrapped && safeInstanceof(unwrapped.schema, z.ZodNumber)
        ? getNumberConstraints(unwrapped.schema)
        : {};
    const dateConstraints =
      unwrapped && safeInstanceof(unwrapped.schema, z.ZodDate)
        ? getDateConstraints(unwrapped.schema)
        : {};

    return {
      ...field,
      schema,
      kind: inferredKind,
      required,
      description,
      options,
      minLength: field.minLength ?? stringConstraints.minLength,
      maxLength: field.maxLength ?? stringConstraints.maxLength,
      min: field.min ?? numberConstraints.min,
      max: field.max ?? numberConstraints.max,
      step:
        field.step ??
        (typeof numberConstraints.isInt === "boolean"
          ? numberConstraints.isInt
            ? 1
            : undefined
          : undefined),
      calendarProps: field.calendarProps
        ? field.calendarProps
        : dateConstraints.minDate || dateConstraints.maxDate
          ? {
              fromDate: dateConstraints.minDate,
              toDate: dateConstraints.maxDate,
            }
          : undefined,
    };
  });
}

function sortFields<TValues extends FieldValues>(
  fields: DynamicFieldConfig<TValues>[],
): DynamicFieldConfig<TValues>[] {
  return [...fields].sort((a, b) => {
    const orderA = a.layout?.order ?? 0;
    const orderB = b.layout?.order ?? 0;
    return orderA - orderB;
  });
}

export function createDynamicFields<Schema extends ZodSchema>(
  schema: Schema,
  overrides?: Record<string, Partial<DynamicFieldConfig<SchemaValues<Schema>>>>,
): DynamicFieldConfig<SchemaValues<Schema>>[] {
  const shape = getZodShape(schema);
  if (!shape) return [];
  const fields = Object.entries(shape).map(([key, value]) => ({
    name: key as Path<SchemaValues<Schema>>,
    label: humanizeLabel(key),
    schema: value,
  }));
  return mergeFieldOverrides(fields, overrides);
}

export function DynamicForm<Schema extends ZodSchema>({
  schema,
  fields,
  fieldOverrides,
  defaultValues,
  onSubmit,
  onInvalid,
  form: externalForm,
  layout,
  disabled,
  readOnly,
  showOptionalLabel = false,
  disableWhileSubmitting = true,
  className,
  fieldSetProps,
  fieldGroupProps,
  actions,
}: DynamicFormProps<Schema>) {
  const resolverSchema = schema as z.core.$ZodType<
    SchemaValues<Schema>,
    SchemaValues<Schema>
  >;
  const internalForm = useForm<
    SchemaValues<Schema>,
    unknown,
    SchemaValues<Schema>
  >({
    resolver: zodResolver(resolverSchema) as Resolver<
      SchemaValues<Schema>,
      unknown,
      SchemaValues<Schema>
    >,
    defaultValues,
    criteriaMode: "all",
  });
  const form = externalForm ?? internalForm;

  const schemaShape = React.useMemo(() => getZodShape(schema), [schema]);
  const schemaMap = React.useMemo(() => {
    const map: Record<string, ZodSchema> = {};
    if (schemaShape) {
      for (const [key, value] of Object.entries(schemaShape)) {
        map[key] = value;
      }
    }
    return map;
  }, [schemaShape]);

  const baseFields = React.useMemo(() => {
    if (fields && fields.length) return fields;
    return createDynamicFields(schema, fieldOverrides);
  }, [fields, schema, fieldOverrides]);

  const mergedFields = React.useMemo(
    () => mergeFieldOverrides(baseFields, fieldOverrides),
    [baseFields, fieldOverrides],
  );

  const normalizedFields = React.useMemo(
    () => sortFields(normalizeFields(mergedFields, schemaMap)),
    [mergedFields, schemaMap],
  );

  const formDisabled = Boolean(
    disabled || (disableWhileSubmitting && form.formState.isSubmitting),
  );

  const layoutVariant =
    layout?.variant ??
    (layout?.columns && layout.columns > 1 ? "grid" : "stack");
  const columns = layout?.columns ?? GRID_FALLBACK_COLUMNS;
  const gridStyle: React.CSSProperties | undefined =
    layoutVariant === "grid"
      ? {
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          ...(layout?.style ?? {}),
        }
      : layout?.style;

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className={cn("space-y-8", className)}
        noValidate
      >
        <FieldSet {...fieldSetProps}>
          <FieldGroup
            {...fieldGroupProps}
            className={cn(
              layoutVariant === "grid" ? "grid gap-6" : "flex flex-col gap-6",
              layout?.className,
              layout?.groupClassName,
              fieldGroupProps?.className,
            )}
            style={gridStyle}
          >
            {normalizedFields.map((field) => (
              <DynamicFormField
                key={String(field.name)}
                field={field}
                form={form}
                showOptionalLabel={showOptionalLabel}
                disabled={formDisabled}
                readOnly={readOnly ?? false}
              />
            ))}
          </FieldGroup>
        </FieldSet>
        {actions}
      </form>
    </FormProvider>
  );
}

type DynamicFormFieldProps<TValues extends FieldValues> = {
  field: DynamicFieldConfig<TValues>;
  form: UseFormReturn<TValues, unknown, TValues>;
  showOptionalLabel: boolean;
  disabled: boolean;
  readOnly: boolean;
};

function DynamicFormField<TValues extends FieldValues>({
  field,
  form,
  showOptionalLabel,
  disabled,
  readOnly,
}: DynamicFormFieldProps<TValues>) {
  const baseId = React.useId();

  if (field.hidden || field.kind === "hidden") {
    return (
      <Controller
        control={form.control}
        name={field.name}
        render={() => <></>}
      />
    );
  }

  const fieldId = `${String(field.name).replace(/\./g, "-")}-${baseId}`;
  const descriptionId = field.description
    ? `${fieldId}-description`
    : undefined;

  return (
    <Controller
      control={form.control}
      name={field.name}
      render={({ field: controllerField }) => {
        const error = getErrorByPath(form.formState.errors, field.name);
        const errors = normalizeFieldErrors(error);
        const hasError = errors.length > 0;

        const isDisabled = Boolean(field.disabled ?? disabled);
        const isReadOnly = Boolean(field.readOnly ?? readOnly);
        const required = Boolean(field.required);
        const describedBy =
          [descriptionId, hasError ? `${fieldId}-error` : null]
            .filter(Boolean)
            .join(" ") || undefined;

        const layoutStyle: React.CSSProperties = {
          ...(field.layout?.style ?? {}),
          ...(field.layout?.colSpan
            ? {
                gridColumn: `span ${field.layout.colSpan} / span ${field.layout.colSpan}`,
              }
            : {}),
          ...(field.layout?.rowSpan
            ? {
                gridRow: `span ${field.layout.rowSpan} / span ${field.layout.rowSpan}`,
              }
            : {}),
          ...(field.layout?.colStart
            ? { gridColumnStart: field.layout.colStart }
            : {}),
          ...(field.layout?.rowStart
            ? { gridRowStart: field.layout.rowStart }
            : {}),
          ...(field.layout?.area ? { gridArea: field.layout.area } : {}),
        };

        const renderProps: DynamicFieldRenderProps<TValues> = {
          name: field.name,
          id: fieldId,
          label: field.label,
          description: field.description,
          placeholder: field.placeholder,
          required,
          disabled: isDisabled,
          readOnly: isReadOnly,
          options: field.options,
          kind: field.kind ?? "text",
          errors,
          field: {
            value: controllerField.value,
            onChange: controllerField.onChange,
            onBlur: controllerField.onBlur,
            name: controllerField.name,
            ref: controllerField.ref,
          },
          form,
          fieldConfig: field,
        };

        const control =
          field.render?.(renderProps) ??
          (field.component
            ? React.createElement(field.component, renderProps)
            : renderDefaultControl(renderProps, describedBy));

        const shouldInlineLabel =
          field.kind === "checkbox" || field.kind === "switch";

        const labelContent = (
          <>
            <span>{field.label}</span>
            {required ? (
              <span className="text-destructive"> *</span>
            ) : showOptionalLabel ? (
              <span className="text-muted-foreground text-xs">
                {" "}
                (опционально)
              </span>
            ) : null}
          </>
        );

        return (
          <Field
            orientation={field.orientation ?? "vertical"}
            data-invalid={hasError ? "true" : "false"}
            data-disabled={isDisabled ? "true" : "false"}
            className={cn(field.className, field.layout?.className)}
            style={layoutStyle}
          >
            {!field.hideLabel && !shouldInlineLabel && field.label ? (
              <FieldLabel htmlFor={fieldId} className={field.labelClassName}>
                {labelContent}
              </FieldLabel>
            ) : null}

            <FieldContent>
              {shouldInlineLabel && field.label && !field.hideLabel ? (
                <Label
                  htmlFor={fieldId}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium",
                    field.labelClassName,
                  )}
                >
                  {control}
                  {labelContent}
                </Label>
              ) : (
                control
              )}

              {!field.hideDescription && field.description ? (
                <FieldDescription
                  id={descriptionId}
                  className={field.descriptionClassName}
                >
                  {field.description}
                </FieldDescription>
              ) : null}

              {!field.hideError ? (
                <FieldError
                  id={hasError ? `${fieldId}-error` : undefined}
                  errors={errors}
                  className={field.errorClassName}
                />
              ) : null}
            </FieldContent>
          </Field>
        );
      }}
    />
  );
}
function renderDefaultControl<TValues extends FieldValues>(
  props: DynamicFieldRenderProps<TValues>,
  describedBy?: string,
) {
  const {
    field,
    fieldConfig,
    options,
    kind,
    required,
    disabled,
    readOnly,
    id,
  } = props;
  const ariaInvalid = props.errors.length ? true : undefined;

  if (kind === "textarea") {
    const {
      minRows,
      maxRows,
      rows: rowsProp,
      maxLength: maxLengthProp,
      showCounter,
      forceShowCounter,
      ...textareaProps
    } = fieldConfig.textareaProps ?? {};
    const resolvedMinRows = minRows ?? rowsProp ?? fieldConfig.rows ?? 1;
    const maxLengthCandidate = fieldConfig.maxLength ?? maxLengthProp;
    const resolvedMaxLength =
      maxLengthCandidate ??
      (forceShowCounter
        ? DEFAULT_TEXTAREA_MAX_LENGTH
        : Number.MAX_SAFE_INTEGER);
    const shouldShowCounter =
      forceShowCounter === true
        ? true
        : typeof showCounter === "boolean"
          ? showCounter
          : maxLengthCandidate !== undefined;

    return (
      <CharacterLimitedTextarea
        id={id}
        aria-invalid={ariaInvalid}
        aria-describedby={describedBy}
        disabled={disabled}
        readOnly={readOnly}
        minRows={resolvedMinRows}
        maxRows={maxRows}
        minLength={fieldConfig.minLength}
        maxLength={resolvedMaxLength}
        showCounter={shouldShowCounter}
        placeholder={props.placeholder}
        className={fieldConfig.controlClassName}
        value={field.value == null ? "" : String(field.value)}
        onChange={(event) => field.onChange(event.target.value)}
        onBlur={field.onBlur}
        ref={field.ref as React.Ref<HTMLTextAreaElement>}
        {...textareaProps}
      />
    );
  }

  if (kind === "checkbox") {
    return (
      <Checkbox
        id={id}
        checked={Boolean(field.value)}
        onCheckedChange={(next) => field.onChange(Boolean(next))}
        disabled={disabled || readOnly}
        aria-invalid={ariaInvalid}
        aria-describedby={describedBy}
        className={fieldConfig.controlClassName}
        {...fieldConfig.checkboxProps}
      />
    );
  }

  if (kind === "checkbox-group") {
    const values = Array.isArray(field.value) ? field.value : [];
    return (
      <div
        className={cn("grid gap-2", fieldConfig.controlClassName)}
        data-slot="checkbox-group"
      >
        {(options ?? []).map((option) => {
          const checked = values.includes(option.value);
          return (
            <Label
              key={String(option.value)}
              className="flex items-start gap-2 text-sm font-medium"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(next) => {
                  if (next) {
                    field.onChange([...values, option.value]);
                  } else {
                    field.onChange(
                      values.filter((value) => value !== option.value),
                    );
                  }
                }}
                disabled={disabled || readOnly || option.disabled}
                aria-invalid={ariaInvalid}
                aria-describedby={describedBy}
                {...fieldConfig.checkboxProps}
              />
              <span className="flex flex-col">
                <span>{option.label}</span>
                {option.description ? (
                  <span className="text-muted-foreground text-xs">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </Label>
          );
        })}
      </div>
    );
  }

  if (kind === "switch") {
    return (
      <Switch
        id={id}
        checked={Boolean(field.value)}
        onCheckedChange={(next) => field.onChange(Boolean(next))}
        disabled={disabled || readOnly}
        aria-invalid={ariaInvalid}
        aria-describedby={describedBy}
        className={fieldConfig.controlClassName}
        {...fieldConfig.switchProps}
      />
    );
  }

  if (kind === "select") {
    const hasNumberValues =
      options?.length &&
      options.every((option) => typeof option.value === "number");

    const value =
      field.value === undefined || field.value === null
        ? ""
        : String(field.value);

    return (
      <Select
        id={id}
        value={value}
        disabled={disabled || readOnly}
        aria-invalid={ariaInvalid}
        aria-describedby={describedBy}
        multiple={fieldConfig.multiple}
        className={fieldConfig.controlClassName}
        onChange={(event) => {
          if (fieldConfig.multiple) {
            const selected = Array.from(event.target.selectedOptions).map(
              (opt) => (hasNumberValues ? Number(opt.value) : opt.value),
            );
            field.onChange(selected);
            return;
          }
          const next = hasNumberValues
            ? Number(event.target.value)
            : event.target.value;
          field.onChange(next);
        }}
        {...fieldConfig.selectProps}
      >
        {props.placeholder && !fieldConfig.multiple ? (
          <option value="" disabled={required}>
            {props.placeholder}
          </option>
        ) : null}
        {(options ?? []).map((option) => (
          <option
            key={String(option.value)}
            value={String(option.value)}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </Select>
    );
  }

  if (kind === "radio") {
    return (
      <RadioGroup
        id={id}
        value={
          field.value === undefined || field.value === null
            ? ""
            : String(field.value)
        }
        onValueChange={(value) => field.onChange(value)}
        disabled={disabled || readOnly}
        aria-invalid={ariaInvalid}
        aria-describedby={describedBy}
        className={cn("grid gap-2", fieldConfig.controlClassName)}
        {...fieldConfig.radioGroupProps}
      >
        {(options ?? []).map((option) => {
          const itemId = `${id}-${String(option.value)}`;
          return (
            <Label
              key={String(option.value)}
              htmlFor={itemId}
              className="flex items-start gap-2"
            >
              <RadioGroupItem
                id={itemId}
                value={String(option.value)}
                disabled={option.disabled}
              />
              <span className="flex flex-col text-sm font-medium">
                <span>{option.label}</span>
                {option.description ? (
                  <span className="text-muted-foreground text-xs">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </Label>
          );
        })}
      </RadioGroup>
    );
  }

  if (kind === "slider") {
    const value =
      typeof field.value === "number" ? field.value : (fieldConfig.min ?? 0);
    return (
      <div className="flex items-center gap-3">
        <Slider
          id={id}
          value={[value]}
          min={fieldConfig.min}
          max={fieldConfig.max}
          step={fieldConfig.step}
          disabled={disabled || readOnly}
          aria-invalid={ariaInvalid}
          aria-describedby={describedBy}
          className={fieldConfig.controlClassName}
          onValueChange={(values) => field.onChange(values[0])}
          {...fieldConfig.sliderProps}
        />
        {fieldConfig.showValue ? (
          <span className="text-muted-foreground w-10 text-right text-sm">
            {value}
          </span>
        ) : null}
      </div>
    );
  }

  if (kind === "toggle-group") {
    const type = fieldConfig.toggleGroupProps?.type ?? "single";
    const {
      type: _type,
      value: _value,
      defaultValue: _defaultValue,
      onValueChange: _onValueChange,
      ...toggleProps
    } = fieldConfig.toggleGroupProps ?? {};

    if (type === "multiple") {
      const value = Array.isArray(field.value)
        ? field.value.map((item) => String(item))
        : [];
      return (
        <ToggleGroup
          id={id}
          type="multiple"
          value={value}
          onValueChange={(next: string[]) => field.onChange(next)}
          disabled={disabled || readOnly}
          aria-invalid={ariaInvalid}
          aria-describedby={describedBy}
          className={fieldConfig.controlClassName}
          {...toggleProps}
        >
          {(options ?? []).map((option) => (
            <ToggleGroupItem
              key={String(option.value)}
              value={String(option.value)}
              disabled={option.disabled}
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      );
    }

    const value =
      field.value === undefined || field.value === null
        ? ""
        : String(field.value);

    return (
      <ToggleGroup
        id={id}
        type="single"
        value={value}
        onValueChange={(next: string) => field.onChange(next)}
        disabled={disabled || readOnly}
        aria-invalid={ariaInvalid}
        aria-describedby={describedBy}
        className={fieldConfig.controlClassName}
        {...toggleProps}
      >
        {(options ?? []).map((option) => (
          <ToggleGroupItem
            key={String(option.value)}
            value={String(option.value)}
            disabled={option.disabled}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    );
  }

  if (kind === "date") {
    const value = field.value instanceof Date ? field.value : undefined;
    const formatted = value
      ? format(value, fieldConfig.dateFormat ?? "PPP")
      : null;
    const allowClear = fieldConfig.allowClear ?? !required;
    const calendarProps = fieldConfig.calendarProps as
      | Omit<CalendarSingleProps, "mode" | "selected" | "onSelect">
      | undefined;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || readOnly}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              fieldConfig.controlClassName,
            )}
            aria-invalid={ariaInvalid}
            aria-describedby={describedBy}
          >
            <CalendarIcon className="mr-2 size-4" />
            {formatted ?? props.placeholder ?? "Выберите дату"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarSingle
            mode="single"
            selected={value}
            onSelect={(date) => field.onChange(date ?? null)}
            initialFocus
            {...calendarProps}
          />
          {allowClear && value ? (
            <div className="border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => field.onChange(null)}
              >
                Очистить
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    );
  }

  if (kind === "date-input" || kind === "datetime" || kind === "time") {
    const inputType =
      kind === "datetime"
        ? "datetime-local"
        : kind === "time"
          ? "time"
          : "date";
    return (
      <Input
        id={id}
        type={inputType}
        value={field.value == null ? "" : String(field.value)}
        onChange={(event) => field.onChange(event.target.value)}
        onBlur={field.onBlur}
        ref={field.ref as React.Ref<HTMLInputElement>}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={ariaInvalid}
        aria-describedby={describedBy}
        className={fieldConfig.controlClassName}
        {...fieldConfig.inputProps}
      />
    );
  }

  const inputType =
    kind === "email" ||
    kind === "password" ||
    kind === "tel" ||
    kind === "url" ||
    kind === "color"
      ? kind
      : kind === "number"
        ? "number"
        : "text";

  return (
    <Input
      id={id}
      type={inputType}
      value={
        field.value === undefined || field.value === null
          ? ""
          : String(field.value)
      }
      onChange={(event) => {
        if (kind === "number") {
          const raw = event.target.value;
          field.onChange(raw === "" ? undefined : Number(raw));
          return;
        }
        field.onChange(event.target.value);
      }}
      onBlur={field.onBlur}
      ref={field.ref as React.Ref<HTMLInputElement>}
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={ariaInvalid}
      aria-describedby={describedBy}
      placeholder={props.placeholder}
      min={fieldConfig.min}
      max={fieldConfig.max}
      step={fieldConfig.step}
      minLength={fieldConfig.minLength}
      maxLength={fieldConfig.maxLength}
      className={fieldConfig.controlClassName}
      {...fieldConfig.inputProps}
    />
  );
}
