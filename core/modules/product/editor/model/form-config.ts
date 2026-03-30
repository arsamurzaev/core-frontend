import { type AttributeDto, AttributeDtoDataType } from "@/shared/api/generated/react-query";
import { type DynamicFieldConfig } from "@/shared/ui/dynamic-form";
import { type Path } from "react-hook-form";

export type ProductAttributeFormValue = string | boolean | null;

export type CreateProductFormValues = {
  name: string;
  price: string;
  brandId?: string;
  categoryIds: string[];
  hasDiscount: boolean;
  attributes: Record<string, ProductAttributeFormValue>;
};

export function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeCategoryIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function normalizeAttributeValue(
  value: unknown,
): ProductAttributeFormValue | undefined {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  return undefined;
}

function normalizeAttributesRecord(
  value: unknown,
): Record<string, ProductAttributeFormValue> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const entries = Object.entries(value)
    .map(([key, entryValue]) => {
      const normalizedValue = normalizeAttributeValue(entryValue);
      return normalizedValue === undefined ? null : [key, normalizedValue];
    })
    .filter((entry): entry is [string, ProductAttributeFormValue] => entry !== null);

  return Object.fromEntries(entries);
}

export function normalizeCreateProductFormValues(
  values: CreateProductFormValues,
): CreateProductFormValues {
  return {
    name: typeof values.name === "string" ? values.name : "",
    price: typeof values.price === "string" ? values.price : "",
    brandId: normalizeOptionalString(values.brandId),
    categoryIds: normalizeCategoryIds(values.categoryIds),
    hasDiscount: values.hasDiscount === true,
    attributes: normalizeAttributesRecord(values.attributes),
  };
}

export const CREATE_PRODUCT_FORM_LABEL_CLASS =
  "!flex-none !min-w-[100px] !max-w-[100px] sm:!min-w-[200px] sm:!max-w-[200px]";

export const CREATE_PRODUCT_FORM_FIELD_CLASS =
  "items-start [&>[data-slot=field-label]]:!flex-none [&>[data-slot=field-label]]:!min-w-[100px] [&>[data-slot=field-label]]:!max-w-[100px] sm:[&>[data-slot=field-label]]:!min-w-[200px] sm:[&>[data-slot=field-label]]:!max-w-[200px] [&>[data-slot=field-content]]:min-w-[217px] [&>[data-slot=field-content]]:flex-1";

export const CREATE_PRODUCT_FORM_DEFAULT_VALUES: CreateProductFormValues = {
  name: "",
  price: "",
  brandId: undefined,
  categoryIds: [],
  hasDiscount: false,
  attributes: {},
};

export const PRODUCT_IMAGE_ASPECT_RATIO = 3 / 4;

export const CREATE_PRODUCT_FORM_LAYOUT = {
  variant: "grid" as const,
  columns: 2,
  className: "gap-6",
};

export const CREATE_PRODUCT_FIELDSET_PROPS = {
  className: "space-y-0",
};

export const CREATE_PRODUCT_FIELD_GROUP_PROPS = {
  className: "gap-6",
};

type AttributeFieldOverride = Omit<
  Partial<DynamicFieldConfig<CreateProductFormValues>>,
  "name"
>;

function normalizeOverrideKey(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

// Настройка вида динамических полей по ключу атрибута.
// Можно расширять в одном месте: порядок, плейсхолдеры, размеры и отображение.
export const ATTRIBUTE_FIELD_OVERRIDES_BY_KEY: Record<
  string,
  AttributeFieldOverride
> = {
  subtitle: {
    label: "Подзаголовок",
    kind: "textarea",
    placeholder: "Например: 1 штука, 100 грамм, S размер",
    maxLength: 60,
    orientation: "horizontal",
    labelClassName: CREATE_PRODUCT_FORM_LABEL_CLASS,
    className: CREATE_PRODUCT_FORM_FIELD_CLASS,
    layout: { colSpan: 2, order: 20 },
  },
  description: {
    label: "Описание",
    kind: "textarea",
    placeholder:
      "Например информация о доставке и ее сроках, условия предоставления услуги, технические характеристики и другое",
    maxLength: 2000,
    orientation: "horizontal",
    labelClassName: CREATE_PRODUCT_FORM_LABEL_CLASS,
    className: CREATE_PRODUCT_FORM_FIELD_CLASS,
    layout: { colSpan: 2, order: 30 },
  },
  discount: {
    label: "Скидка",
    layout: { colSpan: 2, order: 80 },
  },
  discountedprice: {
    label: "Итоговая сумма с учетом скидки",
    layout: { colSpan: 2, order: 81 },
  },
  discountstartat: {
    label: "Дата скидки",
    layout: { colSpan: 2, order: 82 },
  },
  discountendat: {
    label: "Дата скидки (по)",
    layout: { colSpan: 2, order: 83 },
  },
};

export const ATTRIBUTE_FIELD_OVERRIDES_BY_ID: Record<
  string,
  AttributeFieldOverride
> = {};

const BASE_FIELDS: DynamicFieldConfig<CreateProductFormValues>[] = [
  {
    name: "name",
    label: "Название товара/услуги",
    kind: "textarea",
    placeholder: "Например: ковер",
    required: true,
    hideError: true,
    maxLength: 70,
    orientation: "horizontal",
    labelClassName: CREATE_PRODUCT_FORM_LABEL_CLASS,
    className: CREATE_PRODUCT_FORM_FIELD_CLASS,
    layout: { colSpan: 2, order: 10 },
  },
  {
    name: "price",
    label: "Цена",
    kind: "text",
    placeholder: "...0",
    required: true,
    hideError: true,
    orientation: "horizontal",
    labelClassName: CREATE_PRODUCT_FORM_LABEL_CLASS,
    className: CREATE_PRODUCT_FORM_FIELD_CLASS,
    inputProps: {
      type: "number",
      min: 0,
      step: "0.01",
      className: "text-center",
      inputMode: "decimal",
    },
    layout: { colSpan: 2, order: 60 },
  },
];

function mergeFieldConfig(
  base: DynamicFieldConfig<CreateProductFormValues>,
  override: AttributeFieldOverride | undefined,
): DynamicFieldConfig<CreateProductFormValues> {
  if (!override) {
    return base;
  }

  return {
    ...base,
    ...override,
    name: base.name,
    layout: {
      ...(base.layout ?? {}),
      ...(override.layout ?? {}),
    },
    inputProps: {
      ...(base.inputProps ?? {}),
      ...(override.inputProps ?? {}),
    },
    textareaProps: {
      ...(base.textareaProps ?? {}),
      ...(override.textareaProps ?? {}),
    },
    selectProps: {
      ...(base.selectProps ?? {}),
      ...(override.selectProps ?? {}),
    },
    checkboxProps: {
      ...(base.checkboxProps ?? {}),
      ...(override.checkboxProps ?? {}),
    },
    switchProps: {
      ...(base.switchProps ?? {}),
      ...(override.switchProps ?? {}),
    },
    radioGroupProps: {
      ...(base.radioGroupProps ?? {}),
      ...(override.radioGroupProps ?? {}),
    },
    sliderProps: {
      ...(base.sliderProps ?? {}),
      ...(override.sliderProps ?? {}),
    },
  };
}

function buildAttributeBaseField(
  attribute: AttributeDto,
): DynamicFieldConfig<CreateProductFormValues> {
  const fieldName =
    `attributes.${attribute.id}` as Path<CreateProductFormValues>;
  const baseField: DynamicFieldConfig<CreateProductFormValues> = {
    name: fieldName,
    label: attribute.displayName,
    required: attribute.isRequired,
    hideError: true,
    orientation: "horizontal",
    labelClassName: CREATE_PRODUCT_FORM_LABEL_CLASS,
    className: CREATE_PRODUCT_FORM_FIELD_CLASS,
    layout: {
      colSpan: 2,
      order: 200 + attribute.displayOrder,
    },
  };

  switch (attribute.dataType) {
    case AttributeDtoDataType.INTEGER:
      return {
        ...baseField,
        kind: "text",
        inputProps: {
          type: "number",
          step: 1,
          inputMode: "numeric",
        },
      };
    case AttributeDtoDataType.DECIMAL:
      return {
        ...baseField,
        kind: "text",
        inputProps: {
          type: "number",
          step: "0.01",
          inputMode: "decimal",
        },
      };
    case AttributeDtoDataType.DATETIME:
      return {
        ...baseField,
        kind: "datetime",
      };
    case AttributeDtoDataType.BOOLEAN:
      return {
        ...baseField,
        kind: "switch",
        className: "rounded-lg border p-2.5",
      };
    case AttributeDtoDataType.ENUM:
      return {
        ...baseField,
        kind: "select",
        placeholder: "Не выбрано",
        options: (attribute.enumValues ?? []).map((option) => ({
          label: option.displayName || option.value,
          value: option.id,
        })),
      };
    case AttributeDtoDataType.STRING:
    default:
      return {
        ...baseField,
        kind: "text",
      };
  }
}

function resolveAttributeOverride(
  attribute: AttributeDto,
): AttributeFieldOverride | undefined {
  const byId = ATTRIBUTE_FIELD_OVERRIDES_BY_ID[attribute.id];
  const byKey = ATTRIBUTE_FIELD_OVERRIDES_BY_KEY[
    normalizeOverrideKey(attribute.key)
  ];

  if (!byId && !byKey) {
    return undefined;
  }

  return {
    ...(byKey ?? {}),
    ...(byId ?? {}),
    layout: {
      ...(byKey?.layout ?? {}),
      ...(byId?.layout ?? {}),
    },
  };
}

export function buildCreateProductFormFields(
  productAttributes: AttributeDto[],
  customFields: DynamicFieldConfig<CreateProductFormValues>[] = [],
): DynamicFieldConfig<CreateProductFormValues>[] {
  return [
    ...BASE_FIELDS,
    ...customFields,
    ...productAttributes.map((attribute) =>
      mergeFieldConfig(
        buildAttributeBaseField(attribute),
        resolveAttributeOverride(attribute),
      ),
    ),
  ];
}
