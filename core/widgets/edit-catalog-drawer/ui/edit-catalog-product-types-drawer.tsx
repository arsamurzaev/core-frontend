"use client";

import {
  AttributeDtoDataType,
  CreateAttributeDtoReqDataType,
  CreateAttributeEnumDtoReqSource,
  getAttributeControllerGetByTypeQueryKey,
  getAttributeControllerGetEnumValuesQueryKey,
  type AttributeDto,
  type AttributeEnumValueDto,
  type ProductTypeAttributeDto,
  type ProductTypeAttributeDtoReq,
  type ProductTypeDto,
  useCatalogControllerGetCurrent,
  useAttributeControllerCreate,
  useAttributeControllerCreateEnumValue,
  useAttributeControllerGetByType,
  useAttributeControllerGetEnumValues,
  useAttributeControllerMergeEnumValues,
  useAttributeControllerRemoveEnumValue,
  useAttributeControllerUpdate,
  useAttributeControllerUpdateEnumValue,
  useProductTypeControllerArchive,
  useProductTypeControllerCreate,
  useProductTypeControllerGetAll,
  useProductTypeControllerGetById,
  useProductTypeControllerUpdate,
} from "@/shared/api/generated/react-query";
import { invalidateProductQueries } from "@/core/modules/product/actions/model";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { FieldError } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";
import { type QueryKey, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  GitMerge,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";

type TypeFormValues = {
  name: string;
  code: string;
  description: string;
};

type QuickCreateValues = {
  typeName: string;
  variantName: string;
  variantValues: string[];
  isRequired: boolean;
  isFilterable: boolean;
};

type AttributeFormValues = {
  displayName: string;
  key: string;
  isRequired: boolean;
  isFilterable: boolean;
};

const emptyTypeForm: TypeFormValues = {
  name: "",
  code: "",
  description: "",
};

const emptyQuickForm: QuickCreateValues = {
  typeName: "",
  variantName: "",
  variantValues: [],
  isRequired: true,
  isFilterable: true,
};

const emptyAttributeForm: AttributeFormValues = {
  displayName: "",
  key: "",
  isRequired: true,
  isFilterable: true,
};

const VALUE_FILTERS = {
  active: "Активные",
  imported: "Импорт",
  merged: "Объединенные",
} as const;

type ValueFilter = keyof typeof VALUE_FILTERS;

const QUICK_VALUE_PRESETS = [
  { label: "Размеры одежды", values: ["XS", "S", "M", "L", "XL"] },
  { label: "Размеры обуви", values: ["36", "37", "38", "39", "40"] },
  { label: "Базовые цвета", values: ["Белый", "Черный", "Серый"] },
] as const;

const VALUE_SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Добавлено вручную",
  IMPORTED: "Из импорта",
};

function normalizeText(value: string): string | undefined {
  const text = value.trim();
  return text ? text : undefined;
}

function normalizeEnumValues(values: string[]): string[] {
  const seen = new Set<string>();

  return values
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLocaleLowerCase("ru-RU");

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function parsePastedEnumValues(value: string): string[] {
  return normalizeEnumValues(value.split(/[\n,;]+/));
}

function toTypeForm(type?: ProductTypeDto | null): TypeFormValues {
  if (!type) return emptyTypeForm;

  return {
    name: type.name,
    code: type.code,
    description: type.description ?? "",
  };
}

function getAttributePayload(
  attributes: ProductTypeAttributeDto[] = [],
): ProductTypeAttributeDtoReq[] {
  return attributes
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((item, index) => ({
      attributeId: item.attributeId,
      isVariant: item.isVariant,
      isRequired: item.isRequired,
      displayOrder: index,
    }));
}

function getTypeSummary(types?: ProductTypeDto[]): {
  badge: string;
  description: string;
} {
  const activeCount = types?.filter((type) => !type.isArchived).length ?? 0;
  const variantCount =
    types?.reduce(
      (count, type) =>
        count +
        (type.attributes ?? []).filter((attribute) => attribute.isVariant)
          .length,
      0,
    ) ?? 0;

  return {
    badge: activeCount ? `${activeCount} типов` : "Не настроено",
    description: variantCount
      ? `${variantCount} свойств выбора в активных типах.`
      : "Быстро создайте тип товара, свойство выбора и значения для карточки.",
  };
}

function valueLabel(value: AttributeEnumValueDto): string {
  return value.displayName || value.value;
}

function valueSourceLabel(value: AttributeEnumValueDto): string {
  return VALUE_SOURCE_LABELS[value.source] ?? "Источник значения";
}

function isEnumAttribute(
  item: ProductTypeAttributeDto,
  attribute?: AttributeDto,
): boolean {
  return (
    attribute?.dataType === AttributeDtoDataType.ENUM ||
    item.attribute.dataType === "ENUM"
  );
}

function isProductTypeSchemaQuery(queryKey: QueryKey): boolean {
  const key = queryKey[0];

  return (
    typeof key === "string" &&
    (key === "/product-type" ||
      key.startsWith("/product-type/") ||
      key === "/catalog/current/type-schema")
  );
}

async function refreshTypeQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  productTypeId?: string,
  attributeId?: string,
  catalogTypeId?: string,
) {
  void productTypeId;

  await Promise.all([
    invalidateProductQueries(queryClient),
    queryClient.invalidateQueries({
      predicate: (query) => isProductTypeSchemaQuery(query.queryKey),
    }),
    catalogTypeId
      ? queryClient.invalidateQueries({
          queryKey: getAttributeControllerGetByTypeQueryKey(catalogTypeId),
        })
      : Promise.resolve(),
    attributeId
      ? queryClient.invalidateQueries({
          queryKey: getAttributeControllerGetEnumValuesQueryKey(attributeId),
        })
      : Promise.resolve(),
  ]);
}

export const EditCatalogProductTypesDrawer: React.FC<{
  disabled?: boolean;
}> = ({ disabled = false }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [selectedTypeId, setSelectedTypeId] = React.useState("");
  const [selectedAttributeId, setSelectedAttributeId] = React.useState("");
  const [quickForm, setQuickForm] =
    React.useState<QuickCreateValues>(emptyQuickForm);
  const [quickValueDraft, setQuickValueDraft] = React.useState("");
  const [typeForm, setTypeForm] = React.useState<TypeFormValues>(emptyTypeForm);
  const [attributeForm, setAttributeForm] =
    React.useState<AttributeFormValues>(emptyAttributeForm);
  const [newValueName, setNewValueName] = React.useState("");
  const [mergeTargetBySource, setMergeTargetBySource] = React.useState<
    Record<string, string>
  >({});
  const [valueFilter, setValueFilter] = React.useState<ValueFilter>("active");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const typesQuery = useProductTypeControllerGetAll(
    { includeArchived: true },
    { query: { staleTime: 30_000 } },
  );
  const catalogQuery = useCatalogControllerGetCurrent({
    query: { enabled: open, staleTime: 60_000 },
  });
  const selectedTypeQuery = useProductTypeControllerGetById(selectedTypeId, {
    query: { enabled: open && Boolean(selectedTypeId), staleTime: 30_000 },
  });
  const catalogTypeId = catalogQuery.data?.typeId ?? "";
  const attributesQuery = useAttributeControllerGetByType(catalogTypeId, {
    query: { enabled: open && Boolean(catalogTypeId), staleTime: 30_000 },
  });
  const enumValuesQuery = useAttributeControllerGetEnumValues(
    selectedAttributeId,
    { query: { enabled: open && Boolean(selectedAttributeId), staleTime: 30_000 } },
  );

  const createType = useProductTypeControllerCreate();
  const updateType = useProductTypeControllerUpdate();
  const archiveType = useProductTypeControllerArchive();
  const createAttribute = useAttributeControllerCreate();
  const updateAttribute = useAttributeControllerUpdate();
  const createValue = useAttributeControllerCreateEnumValue();
  const updateValue = useAttributeControllerUpdateEnumValue();
  const removeValue = useAttributeControllerRemoveEnumValue();
  const mergeValues = useAttributeControllerMergeEnumValues();

  const isBusy =
    disabled ||
    catalogQuery.isLoading ||
    createType.isPending ||
    updateType.isPending ||
    archiveType.isPending ||
    createAttribute.isPending ||
    updateAttribute.isPending ||
    createValue.isPending ||
    updateValue.isPending ||
    removeValue.isPending ||
    mergeValues.isPending;

  const types = React.useMemo(() => typesQuery.data ?? [], [typesQuery.data]);
  const activeTypes = React.useMemo(
    () => types.filter((type) => !type.isArchived),
    [types],
  );
  const archivedTypes = React.useMemo(
    () => types.filter((type) => type.isArchived),
    [types],
  );
  const selectedType =
    selectedTypeQuery.data ?? types.find((type) => type.id === selectedTypeId);
  const typeAttributes = React.useMemo(
    () => selectedType?.attributes ?? [],
    [selectedType?.attributes],
  );
  const attributesById = React.useMemo(() => {
    return new Map((attributesQuery.data ?? []).map((item) => [item.id, item]));
  }, [attributesQuery.data]);
  const variantAttributes = React.useMemo(() => {
    return typeAttributes
      .filter((item) => item.isVariant)
      .slice()
      .sort((left, right) => left.displayOrder - right.displayOrder);
  }, [typeAttributes]);
  const selectedAttribute =
    attributesById.get(selectedAttributeId) ??
    attributesQuery.data?.find((item) => item.id === selectedAttributeId);
  const allEnumValues = React.useMemo(() => {
    return (enumValuesQuery.data ?? [])
      .slice()
      .sort((left, right) => left.displayOrder - right.displayOrder);
  }, [enumValuesQuery.data]);
  const enumValues = React.useMemo(() => {
    if (valueFilter === "imported") {
      return allEnumValues.filter((value) => value.source === "IMPORTED");
    }

    if (valueFilter === "merged") {
      return allEnumValues.filter((value) => value.mergedIntoId);
    }

    return allEnumValues.filter((value) => !value.mergedIntoId);
  }, [allEnumValues, valueFilter]);
  const mergeTargets = allEnumValues.filter((value) => !value.mergedIntoId);
  const summary = getTypeSummary(types);
  const quickVariantValues = React.useMemo(
    () => normalizeEnumValues(quickForm.variantValues),
    [quickForm.variantValues],
  );

  React.useEffect(() => {
    if (!open || selectedTypeId || !activeTypes.length) return;
    setSelectedTypeId(activeTypes[0].id);
  }, [activeTypes, open, selectedTypeId]);

  React.useEffect(() => {
    setTypeForm(toTypeForm(selectedType));
  }, [selectedType]);

  React.useEffect(() => {
    if (!variantAttributes.length) {
      setSelectedAttributeId("");
      return;
    }

    if (
      !selectedAttributeId ||
      !variantAttributes.some((item) => item.attributeId === selectedAttributeId)
    ) {
      setSelectedAttributeId(variantAttributes[0].attributeId);
    }
  }, [selectedAttributeId, variantAttributes]);

  React.useEffect(() => {
    setNewValueName("");
    setMergeTargetBySource({});
    setValueFilter("active");
  }, [selectedAttributeId]);

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setErrorMessage(null);
      setQuickValueDraft("");
      setNewValueName("");
      setMergeTargetBySource({});
      setValueFilter("active");
    }
  }, []);

  const handleError = React.useCallback((error: unknown) => {
    const message = extractApiErrorMessage(error);
    setErrorMessage(message);
    toast.error(message);
  }, []);

  const updateTypeAttributes = React.useCallback(
    async (nextAttributes: ProductTypeAttributeDtoReq[]) => {
      if (!selectedType) return;

      await updateType.mutateAsync({
        id: selectedType.id,
        data: {
          name: selectedType.name,
          code: selectedType.code,
          description: selectedType.description,
          isActive: selectedType.isActive,
          attributes: nextAttributes,
        },
      });
      await refreshTypeQueries(queryClient, selectedType.id, undefined, catalogTypeId);
    },
    [catalogTypeId, queryClient, selectedType, updateType],
  );

  const addQuickVariantValues = React.useCallback((values: string[]) => {
    setQuickForm((current) => ({
      ...current,
      variantValues: normalizeEnumValues([
        ...current.variantValues,
        ...values,
      ]),
    }));
  }, []);

  const handleAddQuickVariantValue = React.useCallback(() => {
    const values = parsePastedEnumValues(quickValueDraft);

    if (!values.length) return;
    addQuickVariantValues(values);
    setQuickValueDraft("");
  }, [addQuickVariantValues, quickValueDraft]);

  const handleRemoveQuickVariantValue = React.useCallback((value: string) => {
    setQuickForm((current) => ({
      ...current,
      variantValues: current.variantValues.filter((item) => item !== value),
    }));
  }, []);

  const handleQuickValuePaste = React.useCallback(
    (event: React.ClipboardEvent<HTMLInputElement>) => {
      const values = parsePastedEnumValues(event.clipboardData.getData("text"));

      if (values.length < 2) return;
      event.preventDefault();
      addQuickVariantValues(values);
      setQuickValueDraft("");
    },
    [addQuickVariantValues],
  );

  const handleCreateType = React.useCallback(async () => {
    const typeName = normalizeText(quickForm.typeName);
    const variantName = normalizeText(quickForm.variantName);
    const variantValues = normalizeEnumValues([
      ...quickForm.variantValues,
      ...parsePastedEnumValues(quickValueDraft),
    ]);
    const currentCatalogTypeId =
      catalogQuery.data?.typeId ?? (await catalogQuery.refetch()).data?.typeId;

    if (!typeName) {
      setErrorMessage("Введите название типа товара.");
      return;
    }

    if (!currentCatalogTypeId) {
      setErrorMessage("Не удалось определить текущий каталог. Обновите страницу.");
      return;
    }

    if (variantValues.length && !variantName) {
      setErrorMessage("Введите название свойства для списка значений.");
      return;
    }

    try {
      setErrorMessage(null);
      const createdType = await createType.mutateAsync({
        data: {
          name: typeName,
          description: null,
        },
      });

      let createdAttributeId: string | undefined;
      if (variantName) {
        const attribute = await createAttribute.mutateAsync({
          data: {
            typeIds: [currentCatalogTypeId],
            displayName: variantName,
            dataType: CreateAttributeDtoReqDataType.ENUM,
            isRequired: quickForm.isRequired,
            isVariantAttribute: true,
            isFilterable: quickForm.isFilterable,
            displayOrder: 0,
          },
        });
        createdAttributeId = attribute.id;

        await updateType.mutateAsync({
          id: createdType.id,
          data: {
            name: createdType.name,
            code: createdType.code,
            description: createdType.description,
            isActive: createdType.isActive,
            attributes: [
              {
                attributeId: attribute.id,
                isVariant: true,
                isRequired: quickForm.isRequired,
                displayOrder: 0,
              },
            ],
          },
        });

        for (const [index, displayName] of variantValues.entries()) {
          await createValue.mutateAsync({
            attributeId: attribute.id,
            data: {
              displayName,
              displayOrder: index,
              source: CreateAttributeEnumDtoReqSource.MANUAL,
            },
          });
        }
      }

      await refreshTypeQueries(
        queryClient,
        createdType.id,
        createdAttributeId,
        currentCatalogTypeId,
      );
      setSelectedTypeId(createdType.id);
      if (createdAttributeId) {
        setSelectedAttributeId(createdAttributeId);
      }
      setQuickForm(emptyQuickForm);
      setQuickValueDraft("");
      toast.success("Тип товара создан.");
    } catch (error) {
      handleError(error);
    }
  }, [
    createAttribute,
    createType,
    createValue,
    catalogQuery,
    handleError,
    queryClient,
    quickForm,
    quickValueDraft,
    updateType,
  ]);

  const handleSaveType = React.useCallback(async () => {
    if (!selectedType) return;

    const name = normalizeText(typeForm.name);
    if (!name) {
      setErrorMessage("Введите название типа товара.");
      return;
    }

    try {
      setErrorMessage(null);
      await updateType.mutateAsync({
        id: selectedType.id,
        data: {
          name,
          code: normalizeText(typeForm.code),
          description: normalizeText(typeForm.description) ?? null,
          isActive: selectedType.isActive,
          attributes: getAttributePayload(selectedType.attributes),
        },
      });
      await refreshTypeQueries(queryClient, selectedType.id, undefined, catalogTypeId);
      toast.success("Тип товара сохранен.");
    } catch (error) {
      handleError(error);
    }
  }, [catalogTypeId, handleError, queryClient, selectedType, typeForm, updateType]);

  const handleArchiveType = React.useCallback(async () => {
    if (!selectedType) return;

    const confirmed = window.confirm(
      `Архивировать тип "${selectedType.name}"? Товары не удалятся, но тип нельзя будет выбрать для новых товаров.`,
    );
    if (!confirmed) return;

    try {
      setErrorMessage(null);
      await archiveType.mutateAsync({ id: selectedType.id });
      await refreshTypeQueries(queryClient, selectedType.id, undefined, catalogTypeId);
      setSelectedTypeId(activeTypes.find((type) => type.id !== selectedType.id)?.id ?? "");
      toast.success("Тип товара отправлен в архив.");
    } catch (error) {
      handleError(error);
    }
  }, [
    activeTypes,
    archiveType,
    catalogTypeId,
    handleError,
    queryClient,
    selectedType,
  ]);

  const handleAddAttribute = React.useCallback(async () => {
    if (!selectedType) return;

    const displayName = normalizeText(attributeForm.displayName);
    if (!displayName) {
      setErrorMessage("Введите название свойства.");
      return;
    }

    const currentCatalogTypeId =
      catalogQuery.data?.typeId ?? (await catalogQuery.refetch()).data?.typeId;
    if (!currentCatalogTypeId) {
      setErrorMessage("Не удалось определить текущий каталог. Обновите страницу.");
      return;
    }

    try {
      setErrorMessage(null);
      const nextOrder = typeAttributes.length;
      const attribute = await createAttribute.mutateAsync({
        data: {
          typeIds: [currentCatalogTypeId],
          key: normalizeText(attributeForm.key),
          displayName,
          dataType: CreateAttributeDtoReqDataType.ENUM,
          isRequired: attributeForm.isRequired,
          isVariantAttribute: true,
          isFilterable: attributeForm.isFilterable,
          displayOrder: nextOrder,
        },
      });
      const nextAttributes = [
        ...getAttributePayload(typeAttributes),
        {
          attributeId: attribute.id,
          isVariant: true,
          isRequired: attributeForm.isRequired,
          displayOrder: nextOrder,
        },
      ];
      await updateTypeAttributes(nextAttributes);
      await refreshTypeQueries(
        queryClient,
        selectedType.id,
        attribute.id,
        currentCatalogTypeId,
      );
      setAttributeForm(emptyAttributeForm);
      setSelectedAttributeId(attribute.id);
      toast.success("Свойство добавлено.");
    } catch (error) {
      handleError(error);
    }
  }, [
    attributeForm,
    catalogQuery,
    createAttribute,
    handleError,
    queryClient,
    selectedType,
    typeAttributes,
    updateTypeAttributes,
  ]);

  const handlePatchTypeAttribute = React.useCallback(
    async (
      item: ProductTypeAttributeDto,
      patch: Partial<ProductTypeAttributeDtoReq>,
    ) => {
      try {
        setErrorMessage(null);
        const nextAttributes = getAttributePayload(typeAttributes).map((entry) =>
          entry.attributeId === item.attributeId ? { ...entry, ...patch } : entry,
        );
        await updateTypeAttributes(nextAttributes);
      } catch (error) {
        handleError(error);
      }
    },
    [handleError, typeAttributes, updateTypeAttributes],
  );

  const handleMoveAttribute = React.useCallback(
    async (attributeId: string, direction: -1 | 1) => {
      const sorted = typeAttributes
        .slice()
        .sort((left, right) => left.displayOrder - right.displayOrder);
      const index = sorted.findIndex((item) => item.attributeId === attributeId);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;

      const nextSorted = sorted.slice();
      [nextSorted[index], nextSorted[targetIndex]] = [
        nextSorted[targetIndex],
        nextSorted[index],
      ];

      try {
        setErrorMessage(null);
        await updateTypeAttributes(
          nextSorted.map((item, nextIndex) => ({
            attributeId: item.attributeId,
            isVariant: item.isVariant,
            isRequired: item.isRequired,
            displayOrder: nextIndex,
          })),
        );
      } catch (error) {
        handleError(error);
      }
    },
    [handleError, typeAttributes, updateTypeAttributes],
  );

  const handleRemoveAttributeFromType = React.useCallback(
    async (attributeId: string) => {
      try {
        setErrorMessage(null);
        await updateTypeAttributes(
          getAttributePayload(typeAttributes)
            .filter((item) => item.attributeId !== attributeId)
            .map((item, index) => ({ ...item, displayOrder: index })),
        );
        if (selectedAttributeId === attributeId) {
          setSelectedAttributeId("");
        }
        toast.success("Свойство убрано из типа.");
      } catch (error) {
        handleError(error);
      }
    },
    [handleError, selectedAttributeId, typeAttributes, updateTypeAttributes],
  );

  const handleUpdateAttributeDetails = React.useCallback(
    async (attribute: AttributeDto, patch: Partial<AttributeDto>) => {
      if (
        patch.displayName !== undefined &&
        patch.displayName === attribute.displayName
      ) {
        return;
      }

      try {
        setErrorMessage(null);
        await updateAttribute.mutateAsync({
          id: attribute.id,
          data: {
            displayName: patch.displayName ?? attribute.displayName,
            key: patch.key ?? attribute.key,
            dataType: attribute.dataType,
            typeIds: attribute.typeIds,
            isRequired: patch.isRequired ?? attribute.isRequired,
            isVariantAttribute:
              patch.isVariantAttribute ?? attribute.isVariantAttribute,
            isFilterable: patch.isFilterable ?? attribute.isFilterable,
            displayOrder: patch.displayOrder ?? attribute.displayOrder,
            isHidden: patch.isHidden ?? attribute.isHidden,
          },
        });
        await refreshTypeQueries(
          queryClient,
          selectedTypeId,
          attribute.id,
          catalogTypeId,
        );
      } catch (error) {
        handleError(error);
      }
    },
    [catalogTypeId, handleError, queryClient, selectedTypeId, updateAttribute],
  );

  const handleCreateValue = React.useCallback(async () => {
    const displayName = normalizeText(newValueName);
    if (!selectedAttributeId || !displayName) return;

    try {
      setErrorMessage(null);
      await createValue.mutateAsync({
        attributeId: selectedAttributeId,
        data: {
          displayName,
          displayOrder: allEnumValues.length,
          source: CreateAttributeEnumDtoReqSource.MANUAL,
        },
      });
      await refreshTypeQueries(
        queryClient,
        selectedTypeId,
        selectedAttributeId,
        catalogTypeId,
      );
      setNewValueName("");
      toast.success("Значение добавлено.");
    } catch (error) {
      handleError(error);
    }
  }, [
    allEnumValues.length,
    createValue,
    catalogTypeId,
    handleError,
    newValueName,
    queryClient,
    selectedAttributeId,
    selectedTypeId,
  ]);

  const handleUpdateValue = React.useCallback(
    async (value: AttributeEnumValueDto, displayName: string) => {
      if (displayName === (value.displayName ?? value.value)) return;

      try {
        setErrorMessage(null);
        await updateValue.mutateAsync({
          attributeId: value.attributeId,
          id: value.id,
          data: {
            value: value.value,
            displayName: normalizeText(displayName),
            displayOrder: value.displayOrder,
            businessId: value.businessId ?? undefined,
            source: value.source,
          },
        });
        await refreshTypeQueries(
          queryClient,
          selectedTypeId,
          value.attributeId,
          catalogTypeId,
        );
      } catch (error) {
        handleError(error);
      }
    },
    [catalogTypeId, handleError, queryClient, selectedTypeId, updateValue],
  );

  const handleMoveValue = React.useCallback(
    async (value: AttributeEnumValueDto, direction: -1 | 1) => {
      const values = allEnumValues.filter((item) => !item.mergedIntoId);
      const index = values.findIndex((item) => item.id === value.id);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= values.length) return;

      const nextValues = values.slice();
      [nextValues[index], nextValues[targetIndex]] = [
        nextValues[targetIndex],
        nextValues[index],
      ];

      try {
        setErrorMessage(null);
        await Promise.all(
          nextValues.map((item, nextIndex) =>
            updateValue.mutateAsync({
              attributeId: item.attributeId,
              id: item.id,
              data: {
                value: item.value,
                displayName: item.displayName ?? undefined,
                displayOrder: nextIndex,
                businessId: item.businessId ?? undefined,
                source: item.source,
              },
            }),
          ),
        );
        await refreshTypeQueries(
          queryClient,
          selectedTypeId,
          value.attributeId,
          catalogTypeId,
        );
      } catch (error) {
        handleError(error);
      }
    },
    [
      allEnumValues,
      catalogTypeId,
      handleError,
      queryClient,
      selectedTypeId,
      updateValue,
    ],
  );

  const handleRemoveValue = React.useCallback(
    async (value: AttributeEnumValueDto) => {
      try {
        setErrorMessage(null);
        await removeValue.mutateAsync({
          attributeId: value.attributeId,
          id: value.id,
        });
        await refreshTypeQueries(
          queryClient,
          selectedTypeId,
          value.attributeId,
          catalogTypeId,
        );
        toast.success("Значение архивировано.");
      } catch (error) {
        handleError(error);
      }
    },
    [catalogTypeId, handleError, queryClient, removeValue, selectedTypeId],
  );

  const handleMergeValue = React.useCallback(
    async (value: AttributeEnumValueDto) => {
      const targetId = mergeTargetBySource[value.id];
      if (!targetId) return;

      try {
        setErrorMessage(null);
        await mergeValues.mutateAsync({
          attributeId: value.attributeId,
          sourceId: value.id,
          data: { targetId },
        });
        await refreshTypeQueries(
          queryClient,
          selectedTypeId,
          value.attributeId,
          catalogTypeId,
        );
        setMergeTargetBySource((current) => {
          const next = { ...current };
          delete next[value.id];
          return next;
        });
        toast.success("Значения объединены.");
      } catch (error) {
        handleError(error);
      }
    },
    [
      catalogTypeId,
      handleError,
      mergeTargetBySource,
      mergeValues,
      queryClient,
      selectedTypeId,
    ],
  );

  return (
    <AppDrawer
      nested
      open={open}
      dismissible={!disabled}
      onOpenChange={handleOpenChange}
      trigger={
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full min-w-0 items-start justify-between rounded-2xl border border-black/10 px-4 py-4 text-left whitespace-normal hover:bg-muted/30"
          disabled={disabled}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                Типы товаров и свойства выбора
              </span>
              <Badge variant="secondary">{summary.badge}</Badge>
            </div>
            <p className="mt-1 break-words text-sm text-muted-foreground whitespace-normal">
              {summary.description}
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      }
    >
      <AppDrawer.Content className="w-full max-w-5xl">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Типы товаров и свойства выбора"
            description="Создайте понятные типы вроде «Обувь» или «Одежда», а внутри них настройте значения вроде размера или цвета."
            withCloseButton={!disabled}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="grid gap-4">
              <section className="space-y-4 rounded-2xl border border-black/10 bg-muted/20 p-4">
                <div>
                  <h3 className="text-sm font-medium">Быстрое создание</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Достаточно указать название типа, что покупатель выбирает, и
                    собрать значения простыми кнопками ниже.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="product-type-name">Название типа</Label>
                    <Input
                      id="product-type-name"
                      value={quickForm.typeName}
                      disabled={isBusy}
                      placeholder="Например: Мужская обувь"
                      onChange={(event) =>
                        setQuickForm((current) => ({
                          ...current,
                          typeName: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="variant-name">
                      Что выбирает покупатель
                    </Label>
                    <Input
                      id="variant-name"
                      value={quickForm.variantName}
                      disabled={isBusy}
                      placeholder="Например: Размер или Цвет"
                      onChange={(event) =>
                        setQuickForm((current) => ({
                          ...current,
                          variantName: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="variant-value-draft">Значения</Label>
                    <p className="text-sm text-muted-foreground">
                      Добавляйте значения по одному: введите текст и нажмите
                      Enter или плюс. Запятые не нужны.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      id="variant-value-draft"
                      value={quickValueDraft}
                      disabled={isBusy}
                      placeholder="Например: 42"
                      onChange={(event) => setQuickValueDraft(event.target.value)}
                      onPaste={handleQuickValuePaste}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleAddQuickVariantValue();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      className="size-9 shrink-0"
                      disabled={isBusy || !quickValueDraft.trim()}
                      title="Добавить значение"
                      onClick={handleAddQuickVariantValue}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {quickVariantValues.length ? (
                      quickVariantValues.map((value) => (
                        <Badge
                          key={value}
                          variant="secondary"
                          className="max-w-full min-w-0 gap-2 rounded-full border border-black/10 py-1 pl-3 pr-1 text-sm"
                        >
                          <span className="min-w-0 break-words">{value}</span>
                          <button
                            type="button"
                            className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                            disabled={isBusy}
                            title="Убрать значение"
                            aria-label={`Убрать значение ${value}`}
                            onClick={() => handleRemoveQuickVariantValue(value)}
                          >
                            <X className="size-3.5" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <div className="w-full rounded-xl border border-dashed border-black/15 px-3 py-3 text-sm text-muted-foreground">
                        Пока пусто. Добавьте размер, цвет или другой вариант,
                        который должен выбрать покупатель.
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Можно заполнить сразу:
                    </span>
                    {QUICK_VALUE_PRESETS.map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full px-3"
                        disabled={isBusy}
                        onClick={() => addQuickVariantValues([...preset.values])}
                        title={preset.values.join(", ")}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <details className="space-y-2">
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      Дополнительно
                    </summary>
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={quickForm.isRequired}
                          disabled={isBusy}
                          onCheckedChange={(checked) =>
                            setQuickForm((current) => ({
                              ...current,
                              isRequired: checked === true,
                            }))
                          }
                        />
                        Покупатель должен выбрать значение
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={quickForm.isFilterable}
                          disabled={isBusy}
                          onCheckedChange={(checked) =>
                            setQuickForm((current) => ({
                              ...current,
                              isFilterable: checked === true,
                            }))
                          }
                        />
                        Показывать в фильтрах
                      </label>
                    </div>
                  </details>

                  <Button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void handleCreateType()}
                  >
                    <Plus className="size-4" />
                    Создать тип
                  </Button>
                </div>
              </section>

              <section className="grid gap-4 lg:grid-cols-[minmax(220px,280px)_1fr]">
                <div className="space-y-3 rounded-2xl border border-black/10 p-4">
                  <div>
                    <h3 className="text-sm font-medium">Типы в каталоге</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Выберите тип, чтобы редактировать свойства выбора и
                      значения.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    {typesQuery.isLoading ? (
                      <p className="text-sm text-muted-foreground">Загрузка...</p>
                    ) : null}

                    {activeTypes.map((type) => (
                      <Button
                        key={type.id}
                        type="button"
                        variant={selectedTypeId === type.id ? "secondary" : "outline"}
                        className="h-auto justify-start px-3 py-2 text-left"
                        disabled={isBusy}
                        onClick={() => setSelectedTypeId(type.id)}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {type.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {(type.attributes ?? []).filter((item) => item.isVariant)
                              .length || 0}{" "}
                            свойств выбора
                          </span>
                        </span>
                      </Button>
                    ))}

                    {!activeTypes.length && !typesQuery.isLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Типов пока нет. Создайте первый тип выше.
                      </p>
                    ) : null}
                  </div>

                  {archivedTypes.length ? (
                    <details className="space-y-2">
                      <summary className="cursor-pointer text-sm text-muted-foreground">
                        Архив: {archivedTypes.length}
                      </summary>
                      <div className="grid gap-2 pt-2">
                        {archivedTypes.map((type) => (
                          <Button
                            key={type.id}
                            type="button"
                            variant={
                              selectedTypeId === type.id ? "secondary" : "outline"
                            }
                            className="h-auto justify-start px-3 py-2 text-left opacity-70"
                            disabled={isBusy}
                            onClick={() => setSelectedTypeId(type.id)}
                          >
                            {type.name}
                          </Button>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>

                <div className="space-y-4">
                  {selectedType ? (
                    <>
                      <section className="space-y-3 rounded-2xl border border-black/10 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-medium">
                              Настройки типа
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Название видно администратору при создании товара.
                            </p>
                          </div>
                          {selectedType.isArchived ? (
                            <Badge variant="secondary">В архиве</Badge>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="selected-type-name">Название</Label>
                          <Input
                            id="selected-type-name"
                            value={typeForm.name}
                            disabled={isBusy || selectedType.isArchived}
                            onChange={(event) =>
                              setTypeForm((current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                          />
                        </div>

                        <details className="space-y-2">
                          <summary className="cursor-pointer text-sm text-muted-foreground">
                            Дополнительно
                          </summary>
                          <div className="space-y-2">
                            <Label htmlFor="selected-type-code">
                              Код для интеграций
                            </Label>
                            <Input
                              id="selected-type-code"
                              value={typeForm.code}
                              disabled={isBusy || selectedType.isArchived}
                              onChange={(event) =>
                                setTypeForm((current) => ({
                                  ...current,
                                  code: event.target.value,
                                }))
                              }
                            />
                          </div>
                        </details>

                        <div className="space-y-2">
                          <Label htmlFor="selected-type-description">Описание</Label>
                          <Textarea
                            id="selected-type-description"
                            value={typeForm.description}
                            disabled={isBusy || selectedType.isArchived}
                            onChange={(event) =>
                              setTypeForm((current) => ({
                                ...current,
                                description: event.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            disabled={isBusy || selectedType.isArchived}
                            onClick={() => void handleSaveType()}
                          >
                            <Save className="size-4" />
                            Сохранить
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isBusy || selectedType.isArchived}
                            onClick={() => void handleArchiveType()}
                          >
                            <Archive className="size-4" />
                            В архив
                          </Button>
                        </div>
                      </section>

                      <section className="space-y-3 rounded-2xl border border-black/10 p-4">
                        <div>
                          <h3 className="text-sm font-medium">
                            Свойства выбора
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Например: размер, цвет, объем. У каждого свойства
                            свой список значений.
                          </p>
                        </div>

                        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                          <Input
                            value={attributeForm.displayName}
                            disabled={isBusy || selectedType.isArchived}
                            placeholder="Например: Размер"
                            onChange={(event) =>
                              setAttributeForm((current) => ({
                                ...current,
                                displayName: event.target.value,
                              }))
                            }
                          />
                          <Button
                            type="button"
                            disabled={isBusy || selectedType.isArchived}
                            onClick={() => void handleAddAttribute()}
                          >
                            <Plus className="size-4" />
                            Добавить
                          </Button>
                        </div>

                        <details className="space-y-2">
                          <summary className="cursor-pointer text-sm text-muted-foreground">
                            Дополнительно
                          </summary>
                          <div className="grid gap-3 pt-2">
                            <Input
                              value={attributeForm.key}
                              disabled={isBusy || selectedType.isArchived}
                              placeholder="Ключ для интеграций"
                              onChange={(event) =>
                                setAttributeForm((current) => ({
                                  ...current,
                                  key: event.target.value,
                                }))
                              }
                            />
                            <div className="flex flex-wrap gap-4">
                              <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={attributeForm.isRequired}
                                  disabled={isBusy || selectedType.isArchived}
                                  onCheckedChange={(checked) =>
                                    setAttributeForm((current) => ({
                                      ...current,
                                      isRequired: checked === true,
                                    }))
                                  }
                                />
                                Покупатель должен выбрать значение
                              </label>
                              <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={attributeForm.isFilterable}
                                  disabled={isBusy || selectedType.isArchived}
                                  onCheckedChange={(checked) =>
                                    setAttributeForm((current) => ({
                                      ...current,
                                      isFilterable: checked === true,
                                    }))
                                  }
                                />
                                Показывать в фильтрах
                              </label>
                            </div>
                          </div>
                        </details>

                        <div className="grid gap-2">
                          {typeAttributes
                            .slice()
                            .sort(
                              (left, right) =>
                                left.displayOrder - right.displayOrder,
                            )
                            .map((item, index) => {
                              const attribute = attributesById.get(item.attributeId);
                              const canEditValues = isEnumAttribute(item, attribute);

                              return (
                                <div
                                  key={item.attributeId}
                                  className="space-y-3 rounded-xl border border-black/10 p-3"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <button
                                      type="button"
                                      className="min-w-0 text-left"
                                      disabled={isBusy || !canEditValues}
                                      onClick={() =>
                                        setSelectedAttributeId(item.attributeId)
                                      }
                                    >
                                      <span className="block truncate text-sm font-medium">
                                        {attribute?.displayName ??
                                          item.attribute.displayName}
                                      </span>
                                      <span className="block truncate text-xs text-muted-foreground">
                                        Свойство выбора
                                      </span>
                                    </button>
                                    <div className="flex flex-wrap items-center gap-2">
                                      {item.isVariant ? (
                                        <Badge variant="secondary">
                                          Свойство выбора
                                        </Badge>
                                      ) : null}
                                      {item.isRequired ? (
                                        <Badge variant="outline">Обязательная</Badge>
                                      ) : null}
                                      {selectedAttributeId === item.attributeId ? (
                                        <Badge>Значения</Badge>
                                      ) : null}
                                    </div>
                                  </div>

                                  <div className="grid gap-2 sm:grid-cols-2">
                                    {attribute ? (
                                      <Input
                                        key={attribute.updatedAt}
                                        defaultValue={attribute.displayName}
                                        disabled={isBusy || selectedType.isArchived}
                                        onBlur={(event) =>
                                          void handleUpdateAttributeDetails(
                                            attribute,
                                            {
                                              displayName: event.target.value,
                                            },
                                          )
                                        }
                                      />
                                    ) : null}
                                    <div className="flex flex-wrap items-center gap-3">
                                      <label className="flex items-center gap-2 text-sm">
                                        <Switch
                                          checked={item.isVariant}
                                          disabled={
                                            isBusy || selectedType.isArchived
                                          }
                                          onCheckedChange={(checked) =>
                                            void handlePatchTypeAttribute(item, {
                                              isVariant: checked,
                                            })
                                          }
                                        />
                                        Использовать для выбора товара
                                      </label>
                                      <label className="flex items-center gap-2 text-sm">
                                        <Switch
                                          checked={item.isRequired}
                                          disabled={
                                            isBusy || selectedType.isArchived
                                          }
                                          onCheckedChange={(checked) =>
                                            void handlePatchTypeAttribute(item, {
                                              isRequired: checked,
                                            })
                                          }
                                        />
                                        Обязательная
                                      </label>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="outline"
                                      className="size-8"
                                      disabled={
                                        isBusy ||
                                        selectedType.isArchived ||
                                        index === 0
                                      }
                                      title="Выше"
                                      onClick={() =>
                                        void handleMoveAttribute(
                                          item.attributeId,
                                          -1,
                                        )
                                      }
                                    >
                                      <ArrowUp className="size-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="outline"
                                      className="size-8"
                                      disabled={
                                        isBusy ||
                                        selectedType.isArchived ||
                                        index === typeAttributes.length - 1
                                      }
                                      title="Ниже"
                                      onClick={() =>
                                        void handleMoveAttribute(
                                          item.attributeId,
                                          1,
                                        )
                                      }
                                    >
                                      <ArrowDown className="size-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="outline"
                                      className="size-8"
                                      disabled={isBusy || selectedType.isArchived}
                                      title="Убрать из типа"
                                      onClick={() =>
                                        void handleRemoveAttributeFromType(
                                          item.attributeId,
                                        )
                                      }
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}

                          {!typeAttributes.length ? (
                            <p className="text-sm text-muted-foreground">
                              У этого типа пока нет свойств выбора.
                            </p>
                          ) : null}
                        </div>
                      </section>

                      <section className="space-y-3 rounded-2xl border border-black/10 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-medium">
                              Значения свойства
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Эти значения увидит пользователь при выборе товара.
                            </p>
                          </div>
                          <Select
                            value={selectedAttributeId}
                            disabled={isBusy || !variantAttributes.length}
                            onValueChange={setSelectedAttributeId}
                          >
                            <SelectTrigger className="w-full sm:w-60">
                              <SelectValue placeholder="Выберите свойство" />
                            </SelectTrigger>
                            <SelectContent>
                              {variantAttributes.map((item) => (
                                <SelectItem
                                  key={item.attributeId}
                                  value={item.attributeId}
                                >
                                  {item.attribute.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedAttribute ? (
                          <>
                            <div className="flex flex-wrap gap-2">
                              {(Object.keys(VALUE_FILTERS) as ValueFilter[]).map(
                                (filter) => (
                                  <Button
                                    key={filter}
                                    type="button"
                                    size="sm"
                                    variant={
                                      valueFilter === filter
                                        ? "secondary"
                                        : "outline"
                                    }
                                    disabled={isBusy}
                                    onClick={() => setValueFilter(filter)}
                                  >
                                    {VALUE_FILTERS[filter]}
                                  </Button>
                                ),
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Input
                                value={newValueName}
                                disabled={isBusy || selectedType.isArchived}
                                placeholder="Новое значение"
                                onChange={(event) =>
                                  setNewValueName(event.target.value)
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    void handleCreateValue();
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                size="icon"
                                className="size-9 shrink-0"
                                disabled={
                                  isBusy ||
                                  selectedType.isArchived ||
                                  !newValueName.trim()
                                }
                                title="Добавить значение"
                                onClick={() => void handleCreateValue()}
                              >
                                <Plus className="size-4" />
                              </Button>
                            </div>

                            <div className="grid gap-2">
                              {enumValues.map((value, index) => (
                                <div
                                  key={value.id}
                                  className="space-y-3 rounded-xl border border-black/10 p-3"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                      <span className="min-w-0 break-words text-sm font-medium">
                                        {valueLabel(value)}
                                      </span>
                                      <Badge variant="outline">
                                        {valueSourceLabel(value)}
                                      </Badge>
                                      {value.mergedIntoId ? (
                                        <Badge variant="secondary">
                                          Объединено
                                        </Badge>
                                      ) : null}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      #{value.displayOrder}
                                    </span>
                                  </div>

                                  <Input
                                    key={value.updatedAt}
                                    defaultValue={value.displayName ?? value.value}
                                    disabled={
                                      isBusy ||
                                      selectedType.isArchived ||
                                      Boolean(value.mergedIntoId)
                                    }
                                    onBlur={(event) =>
                                      void handleUpdateValue(
                                        value,
                                        event.target.value,
                                      )
                                    }
                                  />

                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="outline"
                                      className="size-8"
                                      disabled={
                                        isBusy ||
                                        selectedType.isArchived ||
                                        index === 0 ||
                                        Boolean(value.mergedIntoId)
                                      }
                                      title="Выше"
                                      onClick={() =>
                                        void handleMoveValue(value, -1)
                                      }
                                    >
                                      <ArrowUp className="size-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="outline"
                                      className="size-8"
                                      disabled={
                                        isBusy ||
                                        selectedType.isArchived ||
                                        index === enumValues.length - 1 ||
                                        Boolean(value.mergedIntoId)
                                      }
                                      title="Ниже"
                                      onClick={() => void handleMoveValue(value, 1)}
                                    >
                                      <ArrowDown className="size-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="outline"
                                      className="size-8"
                                      disabled={
                                        isBusy ||
                                        selectedType.isArchived ||
                                        Boolean(value.mergedIntoId)
                                      }
                                      title="Архивировать"
                                      onClick={() => void handleRemoveValue(value)}
                                    >
                                      <Archive className="size-4" />
                                    </Button>
                                  </div>

                                  {!value.mergedIntoId ? (
                                    <details className="space-y-2">
                                      <summary className="cursor-pointer text-sm text-muted-foreground">
                                        Объединить с другим значением
                                      </summary>
                                      <div className="flex gap-2 pt-2">
                                        <Select
                                          value={mergeTargetBySource[value.id] ?? ""}
                                          disabled={
                                            isBusy || selectedType.isArchived
                                          }
                                          onValueChange={(targetId) =>
                                            setMergeTargetBySource((current) => ({
                                              ...current,
                                              [value.id]: targetId,
                                            }))
                                          }
                                        >
                                          <SelectTrigger className="min-w-0 flex-1">
                                            <SelectValue placeholder="Куда объединить" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {mergeTargets
                                              .filter(
                                                (target) => target.id !== value.id,
                                              )
                                              .map((target) => (
                                                <SelectItem
                                                  key={target.id}
                                                  value={target.id}
                                                >
                                                  {valueLabel(target)}
                                                </SelectItem>
                                              ))}
                                          </SelectContent>
                                        </Select>
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="outline"
                                          className="size-9 shrink-0"
                                          disabled={
                                            isBusy ||
                                            selectedType.isArchived ||
                                            !mergeTargetBySource[value.id]
                                          }
                                          title="Объединить"
                                          onClick={() =>
                                            void handleMergeValue(value)
                                          }
                                        >
                                          <GitMerge className="size-4" />
                                        </Button>
                                      </div>
                                    </details>
                                  ) : null}
                                </div>
                              ))}

                              {!enumValues.length ? (
                                <p className="text-sm text-muted-foreground">
                                  Значений для выбранного фильтра нет.
                                </p>
                              ) : null}
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Выберите свойство или добавьте новое выше.
                          </p>
                        )}
                      </section>
                    </>
                  ) : (
                    <section className="rounded-2xl border border-dashed border-black/10 p-6 text-sm text-muted-foreground">
                      Создайте первый тип товара, чтобы открыть настройки
                      свойств выбора.
                    </section>
                  )}
                </div>
              </section>

              {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
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
