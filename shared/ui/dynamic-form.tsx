"use client";

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
  type FieldError as RhfFieldError,
  type UseFormReturn,
} from "react-hook-form";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
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

type CharacterLimitedTextareaProps = React.ComponentProps<
  typeof CharacterLimitedTextarea
>;
type ToggleGroupProps = React.ComponentProps<typeof ToggleGroup>;
type ToggleGroupSanitizedProps = Omit<
  ToggleGroupProps,
  "type" | "value" | "defaultValue" | "onValueChange"
>;
type DynamicTextareaProps = Omit<
  CharacterLimitedTextareaProps,
  "maxLength" | "value" | "onChange" | "ref"
> & {
  maxLength?: number;
  rows?: number;
  forceShowCounter?: boolean;
};

function sanitizeToggleGroupProps(
  props?: ToggleGroupProps,
): ToggleGroupSanitizedProps {
  if (!props) {
    return {} as ToggleGroupSanitizedProps;
  }

  const nextProps = { ...props } as Record<string, unknown>;

  delete nextProps.type;
  delete nextProps.value;
  delete nextProps.defaultValue;
  delete nextProps.onValueChange;

  return nextProps as ToggleGroupSanitizedProps;
}

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

export type DynamicFormProps<TValues extends FieldValues = FieldValues> = {
  schema?: unknown;
  fields?: DynamicFieldConfig<TValues>[];
  fieldOverrides?: Record<string, Partial<DynamicFieldConfig<TValues>>>;
  defaultValues?: DefaultValues<TValues>;
  onSubmit: (values: TValues) => void | Promise<void>;
  onInvalid?: (errors: FieldErrors<TValues>) => void;
  form?: UseFormReturn<TValues, unknown, TValues>;
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

const GRID_FALLBACK_COLUMNS = 1;
const DEFAULT_TEXTAREA_MAX_LENGTH = 500;
const EMPTY_SELECT_VALUE = "__dynamic_form_empty__";

type CalendarSingleProps = Omit<
  React.ComponentProps<typeof Calendar>,
  "mode" | "selected" | "onSelect"
> & {
  mode: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
};

const CalendarSingle = Calendar as React.ComponentType<CalendarSingleProps>;

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
  if (!error) {
    return [];
  }

  if (error.types) {
    const messages = Object.values(error.types)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter(Boolean)
      .map((message) => ({ message: String(message) }));

    if (messages.length > 0) {
      return messages;
    }
  }

  if (error.message) {
    return [{ message: error.message }];
  }

  return [];
}

function mergeFieldOverrides<TValues extends FieldValues>(
  fields: DynamicFieldConfig<TValues>[],
  overrides?: Record<string, Partial<DynamicFieldConfig<TValues>>>,
): DynamicFieldConfig<TValues>[] {
  if (!overrides) {
    return fields;
  }

  return fields.map((field) => {
    const override = overrides[String(field.name)];
    if (!override) {
      return field;
    }

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

function sortFields<TValues extends FieldValues>(
  fields: DynamicFieldConfig<TValues>[],
): DynamicFieldConfig<TValues>[] {
  return [...fields].sort((left, right) => {
    const leftOrder = left.layout?.order ?? 0;
    const rightOrder = right.layout?.order ?? 0;
    return leftOrder - rightOrder;
  });
}

export function DynamicForm<TValues extends FieldValues = FieldValues>({
  fields = [],
  fieldOverrides,
  defaultValues,
  onSubmit,
  onInvalid,
  form,
  layout,
  disabled = false,
  readOnly = false,
  showOptionalLabel = false,
  disableWhileSubmitting = true,
  className,
  fieldSetProps,
  fieldGroupProps,
  actions,
}: DynamicFormProps<TValues>) {
  const internalForm = useForm<TValues>({
    defaultValues,
  });
  const resolvedForm = form ?? internalForm;
  const normalizedFields = React.useMemo(
    () => sortFields(mergeFieldOverrides(fields, fieldOverrides)),
    [fieldOverrides, fields],
  );

  const {
    variant = "stack",
    columns = GRID_FALLBACK_COLUMNS,
    className: layoutClassName,
    groupClassName,
    style: layoutStyle,
  } = layout ?? {};

  const formDisabled =
    disabled || (disableWhileSubmitting && resolvedForm.formState.isSubmitting);

  const gridStyle =
    variant === "grid"
      ? ({
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(columns, 1)}, minmax(0, 1fr))`,
          ...layoutStyle,
        } satisfies React.CSSProperties)
      : layoutStyle;

  return (
    <FormProvider {...resolvedForm}>
      <form
        onSubmit={resolvedForm.handleSubmit(
          async (values) => {
            await onSubmit(values);
          },
          onInvalid,
        )}
        className={cn("space-y-6", className)}
      >
        <FieldSet {...fieldSetProps} disabled={formDisabled}>
          <FieldGroup
            {...fieldGroupProps}
            className={cn(
              variant === "grid" ? "grid gap-4" : "space-y-4",
              layoutClassName,
              groupClassName,
              fieldGroupProps?.className,
            )}
            style={gridStyle}
          >
            {normalizedFields.map((field) => (
              <DynamicFormField
                key={String(field.name)}
                field={field}
                form={resolvedForm}
                showOptionalLabel={showOptionalLabel}
                disabled={formDisabled}
                readOnly={readOnly}
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
      (forceShowCounter ? DEFAULT_TEXTAREA_MAX_LENGTH : Number.MAX_SAFE_INTEGER);
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
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
          field.onChange(event.target.value)
        }
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
    const isMultiple = Boolean(fieldConfig.multiple);
    const rawValue = isMultiple
      ? Array.isArray(field.value)
        ? field.value[0]
        : undefined
      : field.value;
    const value =
      rawValue === undefined || rawValue === null
        ? undefined
        : String(rawValue);

    return (
      <Select
        value={value}
        disabled={disabled || readOnly}
        onValueChange={(nextValue) => {
          if (nextValue === EMPTY_SELECT_VALUE) {
            field.onChange(isMultiple ? [] : undefined);
            return;
          }

          const next = hasNumberValues ? Number(nextValue) : nextValue;
          field.onChange(isMultiple ? [next] : next);
        }}
      >
        <SelectTrigger
          id={id}
          aria-invalid={ariaInvalid}
          aria-describedby={describedBy}
          onBlur={field.onBlur}
          className={cn("w-full", fieldConfig.controlClassName)}
        >
          <SelectValue placeholder={props.placeholder} />
        </SelectTrigger>
        <SelectContent
          position="popper"
          align="start"
          sideOffset={4}
          collisionPadding={8}
        >
          {!required && props.placeholder ? (
            <SelectItem value={EMPTY_SELECT_VALUE}>
              {props.placeholder}
            </SelectItem>
          ) : null}
          {(options ?? []).map((option) => (
            <SelectItem
              key={String(option.value)}
              value={String(option.value)}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
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
    const toggleProps = sanitizeToggleGroupProps(fieldConfig.toggleGroupProps);

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
