"use client";

import {
  API_BASE_URL,
  FORWARDED_HOST_HEADER,
  getForwardedHost,
} from "@/shared/api/client";
import {
  type AttributeDto,
  AttributeDtoDataType,
  type ProductAttributeValueDto,
  ProductVariantItemDtoReqStatus,
  type UploadQueueStatusDto,
  getProductControllerGetAllQueryKey,
  getProductControllerGetPopularQueryKey,
  s3ControllerEnqueueFromS3,
  s3ControllerGetQueueStatus,
  s3ControllerPresignUpload,
  useProductControllerCreate,
  useProductControllerSetVariants,
} from "@/shared/api/generated";
import { cn } from "@/shared/lib/utils";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerScrollArea,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
import { type DynamicFieldConfig, DynamicForm } from "@/shared/ui/dynamic-form";
import { Input } from "@/shared/ui/input";
import { Progress } from "@/shared/ui/progress";
import { Select } from "@/shared/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Trash2 } from "lucide-react";
import React from "react";
import { type Path, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type AttributeFormValue = string | boolean;
type UploadPhase = "idle" | "uploading" | "processing" | "done" | "error";

interface UploadState {
  phase: UploadPhase;
  progress: number;
  message: string;
}

interface CreateProductDrawerProps {
  className?: string;
}

interface VariantItemState {
  status: ProductVariantItemDtoReqStatus;
  stock: string;
}

const mainFormSchema = z.object({
  name: z.string(),
  price: z.string(),
  status: z.string(),
});

type MainFormValues = z.infer<typeof mainFormSchema>;

const MAIN_FORM_DEFAULT_VALUES: MainFormValues = {
  name: "",
  price: "",
  status: "DRAFT",
};

const attributeFormSchema = z.object({
  values: z.record(z.string(), z.union([z.string(), z.boolean()])),
});

type AttributeFormValues = z.infer<typeof attributeFormSchema>;

const PRODUCT_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Черновик" },
  { value: "ACTIVE", label: "Активен" },
  { value: "HIDDEN", label: "Скрыт" },
  { value: "ARCHIVED", label: "В архиве" },
] as const;

const VARIANT_STATUS_FLOW = [
  ProductVariantItemDtoReqStatus.ACTIVE,
  ProductVariantItemDtoReqStatus.OUT_OF_STOCK,
  ProductVariantItemDtoReqStatus.DISABLED,
] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data;
    if (isRecord(payload)) {
      const message = payload.message;
      if (Array.isArray(message)) {
        const text = message.filter(Boolean).map(String).join(", ");
        if (text) return text;
      }
      if (typeof message === "string" && message.trim()) {
        return message;
      }
      if (typeof payload.error === "string" && payload.error.trim()) {
        return payload.error;
      }
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Не удалось выполнить операцию.";
}

function isQueueDoneStatus(status: string | undefined): boolean {
  if (!status) return false;
  const normalized = status.toUpperCase();
  return (
    normalized === "DONE" ||
    normalized === "COMPLETED" ||
    normalized === "SUCCESS"
  );
}

function isQueueErrorStatus(status: string | undefined): boolean {
  if (!status) return false;
  const normalized = status.toUpperCase();
  return (
    normalized === "ERROR" ||
    normalized === "FAILED" ||
    normalized === "FAIL" ||
    normalized === "CANCELED" ||
    normalized === "CANCELLED"
  );
}

function extractQueueMediaIds(status: UploadQueueStatusDto): string[] {
  const mediaIds = new Set<string>();

  if (status.result?.mediaId) {
    mediaIds.add(status.result.mediaId);
  }

  for (const item of status.results ?? []) {
    if (item.mediaId) {
      mediaIds.add(item.mediaId);
    }
  }

  return Array.from(mediaIds);
}

function parseSseChunk(chunk: string): UploadQueueStatusDto | null {
  const dataLines = chunk
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"));

  if (dataLines.length === 0) {
    return null;
  }

  const dataText = dataLines.map((line) => line.slice(5).trim()).join("\n");
  if (!dataText || dataText === "[DONE]") {
    return null;
  }

  try {
    const parsed = JSON.parse(dataText) as unknown;
    if (!isRecord(parsed)) {
      return null;
    }

    if (isRecord(parsed.data)) {
      return parsed.data as unknown as UploadQueueStatusDto;
    }

    return parsed as unknown as UploadQueueStatusDto;
  } catch {
    return null;
  }
}

async function streamQueueStatus(
  jobId: string,
  onUpdate: (status: UploadQueueStatusDto) => void,
): Promise<UploadQueueStatusDto> {
  const url = `${API_BASE_URL}/s3/images/queue/${encodeURIComponent(jobId)}/stream`;
  const headers = new Headers({ Accept: "text/event-stream" });
  const forwardedHost = getForwardedHost();

  if (forwardedHost) {
    headers.set(FORWARDED_HOST_HEADER, forwardedHost);
  }

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers,
    cache: "no-store",
  });

  if (!response.ok || !response.body) {
    throw new Error(`SSE stream is not available (${response.status}).`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let lastStatus: UploadQueueStatusDto | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const status = parseSseChunk(chunk);
      if (!status) continue;

      lastStatus = status;
      onUpdate(status);

      if (
        isQueueDoneStatus(status.status) ||
        isQueueErrorStatus(status.status)
      ) {
        await reader.cancel();
        return status;
      }
    }
  }

  if (lastStatus) {
    return lastStatus;
  }

  throw new Error("SSE stream ended without queue status.");
}

async function pollQueueStatus(
  jobId: string,
  onUpdate: (status: UploadQueueStatusDto) => void,
): Promise<UploadQueueStatusDto> {
  for (let attempt = 0; attempt < 180; attempt += 1) {
    const status = await s3ControllerGetQueueStatus(jobId);
    onUpdate(status);

    if (isQueueDoneStatus(status.status) || isQueueErrorStatus(status.status)) {
      return status;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 1000));
  }

  throw new Error("Превышено время ожидания обработки файлов.");
}

function isMissingRequiredValue(
  attribute: AttributeDto,
  value: AttributeFormValue | undefined,
): boolean {
  if (!attribute.isRequired) return false;

  if (attribute.dataType === AttributeDtoDataType.BOOLEAN) {
    return typeof value !== "boolean";
  }

  return value === undefined || value === "";
}

function buildInitialAttributeValues(
  attributes: AttributeDto[],
): Record<string, AttributeFormValue> {
  const values: Record<string, AttributeFormValue> = {};

  for (const attribute of attributes) {
    if (attribute.dataType === AttributeDtoDataType.BOOLEAN) {
      values[attribute.id] = false;
    }
  }

  return values;
}

function sortAttributesByDisplayOrder(
  attributes: AttributeDto[],
): AttributeDto[] {
  return [...attributes].sort((left, right) => {
    if (left.displayOrder !== right.displayOrder) {
      return left.displayOrder - right.displayOrder;
    }
    return left.displayName.localeCompare(right.displayName, "ru");
  });
}

type AttributeFieldBuilder = (
  attribute: AttributeDto,
  name: Path<AttributeFormValues>,
) => DynamicFieldConfig<AttributeFormValues>;

function createBaseAttributeField(
  attribute: AttributeDto,
  name: Path<AttributeFormValues>,
): DynamicFieldConfig<AttributeFormValues> {
  return {
    name,
    label: attribute.displayName,
    required: attribute.isRequired,
    hideError: true,
  };
}

const ATTRIBUTE_FIELD_BUILDERS: Record<
  AttributeDtoDataType,
  AttributeFieldBuilder
> = {
  [AttributeDtoDataType.STRING]: (attribute, name) => ({
    ...createBaseAttributeField(attribute, name),
    kind: "text",
  }),
  [AttributeDtoDataType.INTEGER]: (attribute, name) => ({
    ...createBaseAttributeField(attribute, name),
    kind: "text",
    inputProps: {
      type: "number",
      step: 1,
    },
  }),
  [AttributeDtoDataType.DECIMAL]: (attribute, name) => ({
    ...createBaseAttributeField(attribute, name),
    kind: "text",
    inputProps: {
      type: "number",
      step: "0.01",
    },
  }),
  [AttributeDtoDataType.DATETIME]: (attribute, name) => ({
    ...createBaseAttributeField(attribute, name),
    kind: "datetime",
  }),
  [AttributeDtoDataType.BOOLEAN]: (attribute, name) => ({
    ...createBaseAttributeField(attribute, name),
    kind: "switch",
    orientation: "horizontal",
    className: "rounded-lg border p-2.5",
    layout: { colSpan: 2 },
  }),
  [AttributeDtoDataType.ENUM]: (attribute, name) => ({
    ...createBaseAttributeField(attribute, name),
    kind: "select",
    placeholder: "Не выбрано",
    options: (attribute.enumValues ?? []).map((option) => ({
      label: option.displayName || option.value,
      value: option.id,
    })),
  }),
};

function buildDynamicAttributeField(
  attribute: AttributeDto,
): DynamicFieldConfig<AttributeFormValues> {
  const name = `values.${attribute.id}` as Path<AttributeFormValues>;
  const builder =
    ATTRIBUTE_FIELD_BUILDERS[attribute.dataType] ??
    ATTRIBUTE_FIELD_BUILDERS[AttributeDtoDataType.STRING];
  return builder(attribute, name);
}

function buildProductAttributePayload(
  attributes: AttributeDto[],
  values: Record<string, AttributeFormValue>,
): ProductAttributeValueDto[] {
  const payload: ProductAttributeValueDto[] = [];

  for (const attribute of attributes) {
    const rawValue = values[attribute.id];

    if (rawValue === undefined || rawValue === "") {
      continue;
    }

    if (attribute.dataType === AttributeDtoDataType.ENUM) {
      payload.push({
        attributeId: attribute.id,
        enumValueId: String(rawValue),
      });
      continue;
    }

    if (attribute.dataType === AttributeDtoDataType.STRING) {
      payload.push({
        attributeId: attribute.id,
        valueString: String(rawValue),
      });
      continue;
    }

    if (attribute.dataType === AttributeDtoDataType.INTEGER) {
      const number = Number(rawValue);
      if (Number.isFinite(number)) {
        payload.push({
          attributeId: attribute.id,
          valueInteger: Math.trunc(number),
        });
      }
      continue;
    }

    if (attribute.dataType === AttributeDtoDataType.DECIMAL) {
      const number = Number(rawValue);
      if (Number.isFinite(number)) {
        payload.push({
          attributeId: attribute.id,
          valueDecimal: number,
        });
      }
      continue;
    }

    if (attribute.dataType === AttributeDtoDataType.BOOLEAN) {
      payload.push({
        attributeId: attribute.id,
        valueBoolean: Boolean(rawValue),
      });
      continue;
    }

    if (attribute.dataType === AttributeDtoDataType.DATETIME) {
      const parsed = new Date(String(rawValue));
      payload.push({
        attributeId: attribute.id,
        valueDateTime: Number.isNaN(parsed.getTime())
          ? String(rawValue)
          : parsed.toISOString(),
      });
    }
  }

  return payload;
}

export const CreateProductDrawer: React.FC<CreateProductDrawerProps> = ({
  className,
}) => {
  const { type } = useCatalog();
  const queryClient = useQueryClient();
  const createProduct = useProductControllerCreate();
  const setVariants = useProductControllerSetVariants();
  const attributes = React.useMemo(
    () => type.attributes ?? [],
    [type.attributes],
  );

  const [open, setOpen] = React.useState(false);
  const mainForm = useForm<MainFormValues>({
    defaultValues: MAIN_FORM_DEFAULT_VALUES,
  });
  const attributeForm = useForm<AttributeFormValues>({
    defaultValues: {
      values: {},
    },
  });
  const [variantAttributeId, setVariantAttributeId] = React.useState("");
  const [variantItemsState, setVariantItemsState] = React.useState<
    Record<string, VariantItemState>
  >({});
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploadedMediaIds, setUploadedMediaIds] = React.useState<string[]>([]);
  const [uploadState, setUploadState] = React.useState<UploadState>({
    phase: "idle",
    progress: 0,
    message: "",
  });
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const productAttributes = React.useMemo(
    () =>
      sortAttributesByDisplayOrder(
        attributes.filter(
          (attribute) =>
            !attribute.isVariantAttribute &&
            !attribute.isHidden &&
            !attribute.isReadOnly,
        ),
      ),
    [attributes],
  );

  const variantAttributes = React.useMemo(
    () =>
      sortAttributesByDisplayOrder(
        attributes.filter(
          (attribute) =>
            attribute.isVariantAttribute &&
            !attribute.isHidden &&
            !attribute.isReadOnly &&
            attribute.dataType === AttributeDtoDataType.ENUM &&
            (attribute.enumValues?.length ?? 0) > 0,
        ),
      ),
    [attributes],
  );

  const selectedVariantAttribute = React.useMemo(
    () =>
      variantAttributes.find(
        (attribute) => attribute.id === variantAttributeId,
      ) ?? null,
    [variantAttributes, variantAttributeId],
  );

  const mainFormFields = React.useMemo<DynamicFieldConfig<MainFormValues>[]>(
    () => [
      {
        name: "name",
        label: "Название",
        kind: "text",
        placeholder: "Например: Футболка Classic",
        required: true,
        hideError: true,
        layout: { colSpan: 2 },
      },
      {
        name: "price",
        label: "Цена",
        kind: "text",
        required: true,
        hideError: true,
        inputProps: { type: "number", min: 0, step: "0.01" },
      },
      {
        name: "status",
        label: "Статус",
        kind: "select",
        hideError: true,
        options: PRODUCT_STATUS_OPTIONS.map((option) => ({
          label: option.label,
          value: option.value,
        })),
      },
    ],
    [],
  );

  const dynamicFields = React.useMemo<
    DynamicFieldConfig<AttributeFormValues>[]
  >(
    () => productAttributes.map(buildDynamicAttributeField),
    [productAttributes],
  );

  React.useEffect(() => {
    if (!open) return;

    const currentValues = attributeForm.getValues("values");
    const nextValues = { ...currentValues };
    let changed = false;

    for (const attribute of productAttributes) {
      if (
        attribute.dataType === AttributeDtoDataType.BOOLEAN &&
        nextValues[attribute.id] === undefined
      ) {
        nextValues[attribute.id] = false;
        changed = true;
      }
    }

    if (changed) {
      attributeForm.setValue("values", nextValues);
    }

    setVariantAttributeId((prev) => {
      if (
        prev &&
        variantAttributes.some((attribute) => attribute.id === prev)
      ) {
        return prev;
      }
      return variantAttributes[0]?.id ?? "";
    });
  }, [attributeForm, open, productAttributes, variantAttributes]);

  React.useEffect(() => {
    if (!open) return;

    const enumValues = selectedVariantAttribute?.enumValues ?? [];
    setVariantItemsState((prev) => {
      const next: Record<string, VariantItemState> = {};

      for (const enumValue of enumValues) {
        next[enumValue.id] = prev[enumValue.id] ?? {
          status: ProductVariantItemDtoReqStatus.DISABLED,
          stock: "1",
        };
      }

      return next;
    });
  }, [open, selectedVariantAttribute]);

  const resetState = React.useCallback(() => {
    const nextAttributeValues = buildInitialAttributeValues(productAttributes);
    const initialVariant = variantAttributes[0];

    mainForm.reset(MAIN_FORM_DEFAULT_VALUES);
    attributeForm.reset({
      values: nextAttributeValues,
    });
    setVariantAttributeId(initialVariant?.id ?? "");
    const initialVariantItems: Record<string, VariantItemState> = {};
    for (const enumValue of initialVariant?.enumValues ?? []) {
      initialVariantItems[enumValue.id] = {
        status: ProductVariantItemDtoReqStatus.DISABLED,
        stock: "1",
      };
    }
    setVariantItemsState(initialVariantItems);
    setFiles([]);
    setUploadedMediaIds([]);
    setUploadState({ phase: "idle", progress: 0, message: "" });
    setErrorMessage(null);
  }, [attributeForm, mainForm, productAttributes, variantAttributes]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isSubmitting) {
        return;
      }

      setOpen(nextOpen);
      if (!nextOpen) {
        resetState();
      }
    },
    [isSubmitting, resetState],
  );

  const handleVariantAttributeChange = React.useCallback(
    (nextAttributeId: string) => {
      setVariantAttributeId(nextAttributeId);
    },
    [],
  );

  const handleVariantItemStatusChange = React.useCallback(
    (enumValueId: string) => {
      setVariantItemsState((prev) => {
        const current = prev[enumValueId] ?? {
          status: ProductVariantItemDtoReqStatus.DISABLED,
          stock: "1",
        };
        const currentIndex = VARIANT_STATUS_FLOW.indexOf(current.status);
        const nextStatus =
          currentIndex === -1
            ? ProductVariantItemDtoReqStatus.DISABLED
            : VARIANT_STATUS_FLOW[
                (currentIndex + 1) % VARIANT_STATUS_FLOW.length
              ];

        return {
          ...prev,
          [enumValueId]: {
            status: nextStatus,
            stock: current.stock || "1",
          },
        };
      });
    },
    [],
  );

  const handleVariantItemStockChange = React.useCallback(
    (enumValueId: string, stock: string) => {
      const normalizedStock = stock.replace(/\D/g, "").slice(0, 3);

      setVariantItemsState((prev) => {
        const current = prev[enumValueId] ?? {
          status: ProductVariantItemDtoReqStatus.DISABLED,
          stock: "1",
        };

        return {
          ...prev,
          [enumValueId]: {
            status: current.status,
            stock: normalizedStock,
          },
        };
      });
    },
    [],
  );

  const handleFilesChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(event.target.files ?? []);
      setFiles(selected);
      setUploadedMediaIds([]);
      setUploadState({ phase: "idle", progress: 0, message: "" });
    },
    [],
  );

  const removeFile = React.useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setUploadedMediaIds([]);
    setUploadState({ phase: "idle", progress: 0, message: "" });
  }, []);

  const validateForm = React.useCallback((): string | null => {
    const mainValues = mainForm.getValues();
    const attributeValues = attributeForm.getValues("values");

    if (!mainValues.name.trim()) {
      return "Введите название товара.";
    }

    const parsedPrice = Number(mainValues.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return "Укажите корректную цену.";
    }

    for (const attribute of productAttributes) {
      const value = attributeValues[attribute.id];
      if (isMissingRequiredValue(attribute, value)) {
        return `Заполните обязательный атрибут "${attribute.displayName}".`;
      }

      if (
        (attribute.dataType === AttributeDtoDataType.INTEGER ||
          attribute.dataType === AttributeDtoDataType.DECIMAL) &&
        value !== undefined &&
        value !== "" &&
        !Number.isFinite(Number(value))
      ) {
        return `Атрибут "${attribute.displayName}" должен быть числом.`;
      }
    }

    if (selectedVariantAttribute) {
      const enumValues = selectedVariantAttribute.enumValues ?? [];
      const enabledVariants = enumValues.filter((enumValue) => {
        const state = variantItemsState[enumValue.id];
        return (
          (state?.status ?? ProductVariantItemDtoReqStatus.DISABLED) !==
          ProductVariantItemDtoReqStatus.DISABLED
        );
      });

      if (enabledVariants.length === 0) {
        return `Укажите хотя бы одну активную вариацию для "${selectedVariantAttribute.displayName}".`;
      }

      for (const enumValue of enumValues) {
        const state = variantItemsState[enumValue.id];
        if (!state || state.status !== ProductVariantItemDtoReqStatus.ACTIVE) {
          continue;
        }

        const stock = Number(state.stock);
        if (!Number.isFinite(stock) || stock < 1) {
          const label = enumValue.displayName || enumValue.value;
          return `Для вариации "${label}" укажите количество больше 0.`;
        }
      }
    }

    return null;
  }, [
    attributeForm,
    mainForm,
    productAttributes,
    selectedVariantAttribute,
    variantItemsState,
  ]);

  const uploadImagesAndResolveMediaIds = React.useCallback(
    async (imageFiles: File[]): Promise<string[]> => {
      if (imageFiles.length === 0) {
        return [];
      }

      const uploadedBytesByFile = new Map<number, number>();
      const totalBytes = imageFiles.reduce(
        (sum, file) => sum + Math.max(file.size, 1),
        0,
      );
      const uploadedKeys: string[] = [];

      const recalcUploadProgress = () => {
        const loaded = Array.from(uploadedBytesByFile.values()).reduce(
          (sum, value) => sum + value,
          0,
        );
        const uploadPercent = clamp((loaded / totalBytes) * 50, 0, 50);
        setUploadState({
          phase: "uploading",
          progress: uploadPercent,
          message: "Загрузка файлов в S3...",
        });
      };

      for (const [index, file] of imageFiles.entries()) {
        const contentType = file.type || "application/octet-stream";
        const presign = await s3ControllerPresignUpload({
          contentType,
          folder: "products",
        });

        uploadedKeys.push(presign.key);

        await axios.put(presign.uploadUrl, file, {
          headers: {
            "Content-Type": contentType,
          },
          onUploadProgress: (event) => {
            const loaded = Math.min(event.loaded ?? 0, file.size);
            uploadedBytesByFile.set(index, loaded);
            recalcUploadProgress();
          },
        });

        uploadedBytesByFile.set(index, file.size);
        recalcUploadProgress();
      }

      setUploadState({
        phase: "processing",
        progress: 50,
        message: "Постановка файлов в очередь обработки...",
      });

      const enqueuePayload = {
        // Backend expects items as array of objects: [{ key }]
        items: uploadedKeys.map((key) => ({ key })),
      } as unknown as Parameters<typeof s3ControllerEnqueueFromS3>[0];
      const queued = await s3ControllerEnqueueFromS3(enqueuePayload);

      if (!queued.jobId) {
        throw new Error("Сервер не вернул jobId для отслеживания обработки.");
      }

      const handleQueueUpdate = (statusData: UploadQueueStatusDto) => {
        const queueProgress = clamp(Number(statusData.progress) || 0, 0, 100);
        const totalProgress = clamp(50 + queueProgress * 0.5, 50, 100);

        setUploadState({
          phase: "processing",
          progress: totalProgress,
          message: "Обработка изображений...",
        });
      };

      let finalQueueStatus: UploadQueueStatusDto;

      try {
        finalQueueStatus = await streamQueueStatus(
          queued.jobId,
          handleQueueUpdate,
        );
      } catch {
        finalQueueStatus = await pollQueueStatus(
          queued.jobId,
          handleQueueUpdate,
        );
      }

      if (isQueueErrorStatus(finalQueueStatus.status)) {
        throw new Error(
          finalQueueStatus.error ||
            "Ошибка при обработке загруженных изображений.",
        );
      }

      const mediaIds = extractQueueMediaIds(finalQueueStatus);
      if (mediaIds.length === 0) {
        throw new Error("Сервер не вернул mediaId после обработки файлов.");
      }

      setUploadState({
        phase: "done",
        progress: 100,
        message: "Изображения успешно загружены.",
      });

      return mediaIds;
    },
    [],
  );

  const handleSubmit = React.useCallback(async () => {
    if (isSubmitting) return;

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      toast.error(validationError);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const mediaIds =
        uploadedMediaIds.length > 0
          ? uploadedMediaIds
          : await uploadImagesAndResolveMediaIds(files);
      setUploadedMediaIds(mediaIds);

      const mainValues = mainForm.getValues();
      const attributeValues = attributeForm.getValues("values");

      const attributesPayload = buildProductAttributePayload(
        productAttributes,
        attributeValues,
      );

      const createdProduct = await createProduct.mutateAsync({
        data: {
          name: mainValues.name.trim(),
          price: Number(mainValues.price),
          status: mainValues.status,
          mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
          attributes:
            attributesPayload.length > 0 ? attributesPayload : undefined,
        },
      });

      if (selectedVariantAttribute) {
        const variantItems = (selectedVariantAttribute.enumValues ?? []).map(
          (enumValue) => {
            const state = variantItemsState[enumValue.id] ?? {
              status: ProductVariantItemDtoReqStatus.DISABLED,
              stock: "1",
            };

            return {
              enumValueId: enumValue.id,
              status: state.status,
              stock:
                state.status === ProductVariantItemDtoReqStatus.ACTIVE
                  ? Number(state.stock)
                  : undefined,
            };
          },
        );

        await setVariants.mutateAsync({
          id: createdProduct.id,
          data: {
            variantAttributeId: selectedVariantAttribute.id,
            items: variantItems,
          },
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getProductControllerGetPopularQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: getProductControllerGetAllQueryKey(),
        }),
      ]);

      toast.success("Товар успешно создан.");
      setOpen(false);
      resetState();
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      setUploadState((prev) =>
        prev.phase === "idle"
          ? prev
          : { ...prev, phase: "error", message, progress: prev.progress },
      );
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    validateForm,
    uploadImagesAndResolveMediaIds,
    files,
    uploadedMediaIds,
    attributeForm,
    createProduct,
    mainForm,
    productAttributes,
    selectedVariantAttribute,
    variantItemsState,
    setVariants,
    queryClient,
    resetState,
  ]);

  return (
    <Drawer
      open={open}
      onOpenChange={handleOpenChange}
      dismissible={!isSubmitting}
    >
      <DrawerTrigger asChild>
        <Button className={cn("col-span-2", className)} size="lg">
          + Добавить позицию
        </Button>
      </DrawerTrigger>

      <DrawerContent className="mx-auto w-full max-w-2xl">
        <div className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader className="space-y-2">
            <DrawerTitle>Создание товара</DrawerTitle>
            <DrawerDescription>
              Заполните карточку товара, загрузите изображения и сохраните.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerScrollArea className="px-4 pb-4">
            <div className="space-y-5">
              <section className="space-y-3 rounded-xl border p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Атрибуты товара</h3>
                  <Badge variant="outline">
                    {productAttributes.length} шт.
                  </Badge>
                </div>

                {productAttributes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Для текущего типа каталога нет обычных атрибутов.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <DynamicForm
                      schema={attributeFormSchema}
                      form={attributeForm}
                      fields={dynamicFields}
                      onSubmit={() => undefined}
                      disabled={isSubmitting}
                      className="space-y-0"
                      layout={{
                        variant: "grid",
                        columns: 2,
                        className: "gap-3",
                      }}
                      fieldSetProps={{ className: "space-y-0" }}
                      fieldGroupProps={{ className: "gap-3" }}
                    />
                  </div>
                )}
              </section>
              <section className="space-y-3 rounded-xl border p-3">
                <h3 className="text-sm font-semibold">Основное</h3>
                <DynamicForm
                  schema={mainFormSchema}
                  form={mainForm}
                  fields={mainFormFields}
                  onSubmit={() => undefined}
                  disabled={isSubmitting}
                  className="space-y-0"
                  layout={{
                    variant: "grid",
                    columns: 2,
                    className: "gap-3",
                  }}
                  fieldSetProps={{ className: "space-y-0" }}
                  fieldGroupProps={{ className: "gap-3" }}
                />
              </section>

              <section className="space-y-3 rounded-xl border p-3">
                <h3 className="text-sm font-semibold">Вариации</h3>

                {variantAttributes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Вариативные атрибуты с фиксированными значениями не найдены.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <label className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">
                        Атрибут вариаций
                      </span>
                      <Select
                        value={variantAttributeId}
                        onChange={(event) =>
                          handleVariantAttributeChange(event.target.value)
                        }
                        disabled={isSubmitting}
                      >
                        {variantAttributes.map((attribute) => (
                          <option key={attribute.id} value={attribute.id}>
                            {attribute.displayName}
                          </option>
                        ))}
                      </Select>
                    </label>

                    {selectedVariantAttribute ? (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Клик по кнопке вариации переключает статус: ACTIVE →
                          OUT_OF_STOCK → DISABLED
                        </p>

                        <div className="overflow-x-auto pb-1">
                          <div className="grid min-w-max grid-flow-col auto-cols-max gap-2">
                            {(selectedVariantAttribute.enumValues ?? []).map(
                              (enumValue) => {
                                const state = variantItemsState[
                                  enumValue.id
                                ] ?? {
                                  status:
                                    ProductVariantItemDtoReqStatus.DISABLED,
                                  stock: "1",
                                };
                                const displayName =
                                  enumValue.displayName || enumValue.value;

                                return (
                                  <div
                                    key={enumValue.id}
                                    className="flex w-16 flex-col items-center gap-0"
                                  >
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant={
                                        state.status ===
                                        ProductVariantItemDtoReqStatus.ACTIVE
                                          ? "default"
                                          : "outline"
                                      }
                                      className={cn(
                                        "h-8 w-16 rounded-md px-2 text-xs",
                                        state.status ===
                                          ProductVariantItemDtoReqStatus.OUT_OF_STOCK &&
                                          "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/90",
                                        state.status ===
                                          ProductVariantItemDtoReqStatus.DISABLED &&
                                          "border-muted text-muted-foreground opacity-70",
                                      )}
                                      onClick={() =>
                                        handleVariantItemStatusChange(
                                          enumValue.id,
                                        )
                                      }
                                      disabled={isSubmitting}
                                    >
                                      {displayName}
                                    </Button>

                                    {state.status ===
                                    ProductVariantItemDtoReqStatus.ACTIVE ? (
                                      <Input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={3}
                                        value={state.stock}
                                        onChange={(event) =>
                                          handleVariantItemStockChange(
                                            enumValue.id,
                                            event.target.value,
                                          )
                                        }
                                        className="h-8 w-16 rounded-md px-2 text-center text-xs"
                                        disabled={isSubmitting}
                                      />
                                    ) : state.status ===
                                      ProductVariantItemDtoReqStatus.OUT_OF_STOCK ? (
                                      <div className="flex h-8 w-16 items-center justify-center rounded-md bg-secondary px-1 text-center text-[10px] font-medium leading-tight text-secondary-foreground">
                                        Нет в наличии
                                      </div>
                                    ) : (
                                      <div className="h-8 w-16" />
                                    )}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </section>

              <section className="space-y-3 rounded-xl border p-3">
                <h3 className="text-sm font-semibold">Изображения</h3>

                <label className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">
                    Файлы (можно выбрать несколько)
                  </span>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFilesChange}
                    disabled={isSubmitting}
                  />
                </label>

                {files.length > 0 ? (
                  <ul className="space-y-2">
                    {files.map((file, index) => (
                      <li
                        key={`${file.name}-${file.size}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-lg border px-2.5 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Файлы не выбраны.
                  </p>
                )}

                {uploadState.phase !== "idle" ? (
                  <div className="space-y-2 rounded-lg border p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {uploadState.message}
                      </span>
                      <span className="text-xs font-medium">
                        {Math.round(uploadState.progress)}%
                      </span>
                    </div>
                    <Progress value={uploadState.progress} />
                  </div>
                ) : null}

                {uploadedMediaIds.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Загружено mediaId: {uploadedMediaIds.length}
                  </p>
                ) : null}
              </section>

              {errorMessage ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              ) : null}
            </div>
          </DrawerScrollArea>

          <DrawerFooter className="border-t">
            <div className="grid w-full gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  "Сохранить"
                )}
              </Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
