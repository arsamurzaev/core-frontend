"use client";

import {
  buildCreateProductFormFields,
  CREATE_PRODUCT_FORM_FIELD_CLASS,
  CREATE_PRODUCT_FORM_LABEL_CLASS,
  CREATE_PRODUCT_FORM_DEFAULT_VALUES,
  createProductFormSchema,
  type CreateProductFormValues,
  normalizeOptionalString,
} from "@/core/widgets/create-product-drawer/model/form-config";
import {
  buildInitialAttributeValues,
  buildProductAttributePayload,
  isMissingRequiredValue,
  sortAttributesByDisplayOrder,
} from "@/core/widgets/create-product-drawer/model/product-attributes";
import { CreateProductBrandField } from "@/core/widgets/create-product-drawer/ui/create-product-brand-field";
import { CreateProductCategoriesField } from "@/core/widgets/create-product-drawer/ui/create-product-categories-field";
import { CreateProductDiscountLinkedField } from "@/core/widgets/create-product-drawer/ui/create-product-discount-linked-field";
import { type UploadState } from "@/core/widgets/create-product-drawer/model/types";
import { useFilePreviewEntries } from "@/core/widgets/create-product-drawer/model/use-file-preview-entries";
import { extractApiErrorMessage, formatGeneratedZodError } from "@/core/widgets/create-product-drawer/lib/errors";
import {
  extractQueueMediaIds,
  isQueueErrorStatus,
  pollQueueStatus,
  streamQueueStatus,
} from "@/core/widgets/create-product-drawer/lib/upload-queue";
import {
  type AttributeDto,
  AttributeDtoDataType,
  type S3ControllerEnqueueFromS3Body,
  type UploadQueueStatusDto,
  getProductControllerGetAllQueryKey,
  getProductControllerGetPopularQueryKey,
  s3ControllerEnqueueFromS3,
  s3ControllerPresignUpload,
  useBrandControllerGetAll,
  useCategoryControllerGetAll,
  useProductControllerCreate,
} from "@/shared/api/generated";
import {
  ProductControllerCreateBody,
} from "@/shared/api/generated/zod";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { type DynamicFieldRenderProps } from "@/shared/ui/dynamic-form";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildEnqueueFromS3Payload(
  keys: string[],
): S3ControllerEnqueueFromS3Body {
  const items = keys.map((key) => ({ key }));
  return { items };
}

const MAX_PRODUCT_IMAGES = 12;

const DISCOUNT_ATTRIBUTE_KEYS = new Set([
  "discount",
  "discountedprice",
  "discountstartat",
  "discountendat",
]);

function normalizeAttributeKey(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function isDiscountAttribute(attribute: AttributeDto): boolean {
  return DISCOUNT_ATTRIBUTE_KEYS.has(normalizeAttributeKey(attribute.key));
}

export function useCreateProductDrawer() {
  const { type } = useCatalog();
  const queryClient = useQueryClient();
  const createProduct = useProductControllerCreate();
  const brandsQuery = useBrandControllerGetAll({
    query: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });
  const categoriesQuery = useCategoryControllerGetAll({
    query: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });

  const productAttributes = React.useMemo(
    () =>
      sortAttributesByDisplayOrder(
        (type.attributes ?? []).filter(
          (attribute) => !attribute.isHidden && !attribute.isVariantAttribute,
        ),
      ),
    [type.attributes],
  );

  const discountAttributes = React.useMemo(
    () => productAttributes.filter((attribute) => isDiscountAttribute(attribute)),
    [productAttributes],
  );

  const discountAttribute = React.useMemo(
    () =>
      productAttributes.find(
        (attribute) => normalizeAttributeKey(attribute.key) === "discount",
      ) ?? null,
    [productAttributes],
  );

  const discountedPriceAttribute = React.useMemo(
    () =>
      productAttributes.find(
        (attribute) =>
          normalizeAttributeKey(attribute.key) === "discountedprice",
      ) ?? null,
    [productAttributes],
  );

  const brandOptions = React.useMemo(
    () =>
      [...(brandsQuery.data ?? [])]
        .sort((left, right) => left.name.localeCompare(right.name, "ru"))
        .map((brand) => ({
          label: brand.name,
          value: brand.id,
        })),
    [brandsQuery.data],
  );

  const categoryOptions = React.useMemo(
    () =>
      [...(categoriesQuery.data ?? [])]
        .sort((left, right) => left.name.localeCompare(right.name, "ru"))
        .map((category) => ({
          label: category.name,
          value: category.id,
        })),
    [categoriesQuery.data],
  );

  const form = useForm<CreateProductFormValues>({
    defaultValues: CREATE_PRODUCT_FORM_DEFAULT_VALUES,
  });

  const [open, setOpen] = React.useState(false);
  const [isCropperOpen, setIsCropperOpen] = React.useState(false);
  const [cropperInitialIndex, setCropperInitialIndex] = React.useState(0);
  const [cropperEditIndex, setCropperEditIndex] = React.useState<number | null>(
    null,
  );
  const [pendingAddedFiles, setPendingAddedFiles] = React.useState<File[]>([]);
  const [isInitialCropRequired, setIsInitialCropRequired] =
    React.useState(false);
  const [isReorderMode, setIsReorderMode] = React.useState(false);
  const [pendingSwapIndex, setPendingSwapIndex] = React.useState<number | null>(
    null,
  );
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploadedMediaIds, setUploadedMediaIds] = React.useState<string[]>([]);
  const [uploadState, setUploadState] = React.useState<UploadState>({
    phase: "idle",
    progress: 0,
    message: "",
  });
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const hasDiscount = form.watch("hasDiscount");

  const discountAttributeIds = React.useMemo(
    () => discountAttributes.map((attribute) => attribute.id),
    [discountAttributes],
  );

  const visibleAttributes = React.useMemo(
    () =>
      hasDiscount
        ? productAttributes
        : productAttributes.filter((attribute) => !isDiscountAttribute(attribute)),
    [hasDiscount, productAttributes],
  );

  const baseFormFields = React.useMemo(
    () =>
      buildCreateProductFormFields(visibleAttributes, [
        {
          name: "brandId",
          label: "Бренд",
          component: CreateProductBrandField,
          options: brandOptions,
          placeholder: "Выбрать бренд",
          hideError: true,
          orientation: "horizontal",
          labelClassName: CREATE_PRODUCT_FORM_LABEL_CLASS,
          className: CREATE_PRODUCT_FORM_FIELD_CLASS,
          layout: { colSpan: 2, order: 40 },
        },
        {
          name: "categoryIds",
          label: "Категории",
          component: CreateProductCategoriesField,
          options: categoryOptions,
          placeholder: "Выбрать категорию",
          hideError: true,
          orientation: "horizontal",
          labelClassName: CREATE_PRODUCT_FORM_LABEL_CLASS,
          className: CREATE_PRODUCT_FORM_FIELD_CLASS,
          multiple: true,
          layout: { colSpan: 2, order: 50 },
        },
        {
          name: "hasDiscount",
          label: "Есть скидка",
          kind: "checkbox",
          hideError: true,
          orientation: "horizontal",
          className: "items-center",
          layout: { colSpan: 2, order: 70 },
        },
      ]),
    [brandOptions, categoryOptions, visibleAttributes],
  );

  const formFields = React.useMemo(() => {
    const discountFieldName = discountAttribute
      ? `attributes.${discountAttribute.id}`
      : null;
    const discountedPriceFieldName = discountedPriceAttribute
      ? `attributes.${discountedPriceAttribute.id}`
      : null;

    if (!discountFieldName && !discountedPriceFieldName) {
      return baseFormFields;
    }

    return baseFormFields.map((field) => {
      const fieldName = String(field.name);

      if (discountFieldName && fieldName === discountFieldName) {
        return {
          ...field,
          component: (props: DynamicFieldRenderProps<CreateProductFormValues>) =>
            React.createElement(CreateProductDiscountLinkedField, {
              ...props,
              mode: "discount",
              relatedAttributeId: discountedPriceAttribute?.id,
            }),
        };
      }

      if (
        discountedPriceFieldName &&
        fieldName === discountedPriceFieldName
      ) {
        return {
          ...field,
          component: (props: DynamicFieldRenderProps<CreateProductFormValues>) =>
            React.createElement(CreateProductDiscountLinkedField, {
              ...props,
              mode: "discounted-price",
              relatedAttributeId: discountAttribute?.id,
            }),
        };
      }

      return field;
    });
  }, [
    baseFormFields,
    discountAttribute,
    discountedPriceAttribute,
  ]);

  const filePreviewEntries = useFilePreviewEntries(files);
  const filePreviewByFile = React.useMemo(
    () => new Map(filePreviewEntries.map((entry) => [entry.file, entry] as const)),
    [filePreviewEntries],
  );

  const cropperFiles = React.useMemo(() => {
    if (cropperEditIndex !== null) {
      const target = files[cropperEditIndex];
      return target ? [target] : [];
    }

    if (isInitialCropRequired) {
      return pendingAddedFiles;
    }

    return files;
  }, [cropperEditIndex, files, isInitialCropRequired, pendingAddedFiles]);

  const cropperMode = React.useMemo<"required-sequential" | "optional">(
    () =>
      isInitialCropRequired && cropperEditIndex === null
        ? "required-sequential"
        : "optional",
    [cropperEditIndex, isInitialCropRequired],
  );

  const cropperTitle = React.useMemo(() => {
    if (isInitialCropRequired && cropperEditIndex === null) {
      return "Обрежьте фотографии по очереди";
    }

    if (cropperEditIndex !== null) {
      return "Редактирование фотографии";
    }

    return "Обрезка фотографий товара";
  }, [cropperEditIndex, isInitialCropRequired]);

  const cropperDescription = React.useMemo(() => {
    if (isInitialCropRequired && cropperEditIndex === null) {
      return "Сначала обрежьте фото 1, затем 2 и далее. Для первичного добавления это обязательный шаг.";
    }

    if (cropperEditIndex !== null) {
      return "Изменения применятся только к выбранной фотографии.";
    }

    return "Подготовьте одну или несколько фотографий в формате 3:4 перед загрузкой.";
  }, [cropperEditIndex, isInitialCropRequired]);

  const cropperApplyLabel = React.useMemo(
    () =>
      isInitialCropRequired && cropperEditIndex === null
        ? "Обрезать и далее"
        : "Применить обрезку",
    [cropperEditIndex, isInitialCropRequired],
  );

  React.useEffect(() => {
    if (files.length < 2) {
      setIsReorderMode(false);
      setPendingSwapIndex(null);
      if (files.length === 0 && pendingAddedFiles.length === 0) {
        setIsInitialCropRequired(false);
      }
    } else if (pendingSwapIndex !== null && pendingSwapIndex >= files.length) {
      setPendingSwapIndex(null);
    }
  }, [files.length, pendingAddedFiles.length, pendingSwapIndex]);

  React.useEffect(() => {
    if (cropperEditIndex === null) {
      return;
    }

    if (cropperEditIndex < 0 || cropperEditIndex >= files.length) {
      setCropperEditIndex(null);
    }
  }, [cropperEditIndex, files.length]);

  React.useEffect(() => {
    if (!open) return;

    const currentValues = form.getValues("attributes");
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
      form.setValue("attributes", nextValues);
    }
  }, [form, open, productAttributes]);

  React.useEffect(() => {
    if (hasDiscount || discountAttributeIds.length === 0) {
      return;
    }

    const currentValues = form.getValues("attributes");
    const nextValues = { ...currentValues };
    let changed = false;

    for (const attributeId of discountAttributeIds) {
      if (nextValues[attributeId] !== null) {
        nextValues[attributeId] = null;
        changed = true;
      }
    }

    if (changed) {
      form.setValue("attributes", nextValues);
    }
  }, [discountAttributeIds, form, hasDiscount]);

  const resetUploadProgressForFileChanges = React.useCallback(() => {
    setUploadedMediaIds((prev) => (prev.length === 0 ? prev : []));
    setUploadState((prev) =>
      prev.phase === "idle" && prev.progress === 0 && prev.message === ""
        ? prev
        : { phase: "idle", progress: 0, message: "" },
    );
  }, []);

  const resetState = React.useCallback(() => {
    form.reset({
      ...CREATE_PRODUCT_FORM_DEFAULT_VALUES,
      attributes: buildInitialAttributeValues(productAttributes),
    });
    setIsCropperOpen(false);
    setCropperInitialIndex(0);
    setCropperEditIndex(null);
    setPendingAddedFiles([]);
    setIsInitialCropRequired(false);
    setIsReorderMode(false);
    setPendingSwapIndex(null);
    setFiles([]);
    resetUploadProgressForFileChanges();
    setErrorMessage(null);
  }, [form, productAttributes, resetUploadProgressForFileChanges]);

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

  const handleFilesChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const remainingSlots = Math.max(0, MAX_PRODUCT_IMAGES - files.length);
      const selected = Array.from(event.target.files ?? []).slice(
        0,
        remainingSlots,
      );
      if (selected.length === 0) {
        event.target.value = "";
        return;
      }

      setPendingAddedFiles(selected);
      setCropperInitialIndex(0);
      setCropperEditIndex(null);
      setIsInitialCropRequired(true);
      setIsReorderMode(false);
      setPendingSwapIndex(null);
      setIsCropperOpen(true);
      resetUploadProgressForFileChanges();
      event.target.value = "";
    },
    [files.length, resetUploadProgressForFileChanges],
  );

  const swapFilesByIndexes = React.useCallback(
    (leftIndex: number, rightIndex: number) => {
      if (leftIndex === rightIndex) {
        return;
      }

      setFiles((prev) => {
        if (
          leftIndex < 0 ||
          rightIndex < 0 ||
          leftIndex >= prev.length ||
          rightIndex >= prev.length
        ) {
          return prev;
        }

        const next = [...prev];
        [next[leftIndex], next[rightIndex]] = [next[rightIndex], next[leftIndex]];
        return next;
      });
      resetUploadProgressForFileChanges();
    },
    [resetUploadProgressForFileChanges],
  );

  const handleToggleReorderMode = React.useCallback(() => {
    if (
      isSubmitting ||
      isCropperOpen ||
      isInitialCropRequired ||
      files.length < 2
    ) {
      return;
    }

    setPendingSwapIndex(null);
    setIsReorderMode((prev) => !prev);
  }, [files.length, isCropperOpen, isInitialCropRequired, isSubmitting]);

  const handleSelectFileForSwap = React.useCallback(
    (index: number) => {
      if (!isReorderMode || isSubmitting || isCropperOpen) {
        return;
      }

      if (pendingSwapIndex === null) {
        setPendingSwapIndex(index);
        return;
      }

      if (pendingSwapIndex === index) {
        setPendingSwapIndex(null);
        return;
      }

      swapFilesByIndexes(pendingSwapIndex, index);
      setPendingSwapIndex(null);
    },
    [
      isCropperOpen,
      isReorderMode,
      isSubmitting,
      pendingSwapIndex,
      swapFilesByIndexes,
    ],
  );

  const removeFile = React.useCallback(
    (index: number) => {
      const nextFiles = files.filter((_, itemIndex) => itemIndex !== index);
      setFiles(nextFiles);

      if (nextFiles.length === 0) {
        setIsCropperOpen(false);
        setCropperInitialIndex(0);
        if (pendingAddedFiles.length === 0) {
          setIsInitialCropRequired(false);
        }
      } else {
        setCropperInitialIndex((current) =>
          clamp(current, 0, Math.max(nextFiles.length - 1, 0)),
        );
      }

      if (cropperEditIndex !== null) {
        if (index === cropperEditIndex) {
          setCropperEditIndex(null);
        } else if (index < cropperEditIndex) {
          setCropperEditIndex(cropperEditIndex - 1);
        }
      }

      setPendingSwapIndex(null);
      resetUploadProgressForFileChanges();
    },
    [
      cropperEditIndex,
      files,
      pendingAddedFiles.length,
      resetUploadProgressForFileChanges,
    ],
  );

  const handleEditFile = React.useCallback(
    (index: number) => {
      if (isSubmitting || isCropperOpen) {
        return;
      }

      setPendingSwapIndex(null);

      if (isInitialCropRequired) {
        setCropperEditIndex(null);
        setCropperInitialIndex(0);
        setIsCropperOpen(true);
        return;
      }

      setCropperEditIndex(index);
      setCropperInitialIndex(0);
      setIsCropperOpen(true);
    },
    [isCropperOpen, isInitialCropRequired, isSubmitting],
  );

  const handleCropApply = React.useCallback(
    (nextFiles: File[]) => {
      if (cropperEditIndex !== null) {
        const editedFile = nextFiles[0];
        if (editedFile) {
          setFiles((prev) => {
            if (cropperEditIndex < 0 || cropperEditIndex >= prev.length) {
              return prev;
            }

            const result = [...prev];
            result[cropperEditIndex] = editedFile;
            return result;
          });
        }

        setCropperEditIndex(null);
        setPendingSwapIndex(null);
        resetUploadProgressForFileChanges();
        setIsCropperOpen(false);
        return;
      }

      setFiles((prev) => [...prev, ...nextFiles]);
      setCropperInitialIndex(0);
      setIsInitialCropRequired(false);
      setCropperEditIndex(null);
      setPendingAddedFiles([]);
      setPendingSwapIndex(null);
      resetUploadProgressForFileChanges();
      setIsCropperOpen(false);
    },
    [cropperEditIndex, resetUploadProgressForFileChanges],
  );

  const validateForm = React.useCallback((): string | null => {
    const values = form.getValues();

    const parsedValues = createProductFormSchema.safeParse(values);
    if (!parsedValues.success) {
      return formatGeneratedZodError(
        parsedValues.error,
        "Заполните форму товара.",
      );
    }

    const parsedPrice = Number(parsedValues.data.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return "Укажите корректную цену.";
    }

    for (const attribute of visibleAttributes) {
      const value = parsedValues.data.attributes[attribute.id];

      if (isMissingRequiredValue(attribute, value)) {
        return `Заполните обязательный атрибут "${attribute.displayName}".`;
      }

      if (
        (attribute.dataType === AttributeDtoDataType.INTEGER ||
          attribute.dataType === AttributeDtoDataType.DECIMAL) &&
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !Number.isFinite(Number(value))
      ) {
        return `Атрибут "${attribute.displayName}" должен быть числом.`;
      }
    }

    return null;
  }, [form, visibleAttributes]);

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

      const enqueuePayload = buildEnqueueFromS3Payload(uploadedKeys);
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
        finalQueueStatus = await streamQueueStatus(queued.jobId, handleQueueUpdate);
      } catch {
        finalQueueStatus = await pollQueueStatus(queued.jobId, handleQueueUpdate);
      }

      if (isQueueErrorStatus(finalQueueStatus.status)) {
        throw new Error(
          finalQueueStatus.error || "Ошибка при обработке загруженных изображений.",
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

    if (isInitialCropRequired && pendingAddedFiles.length > 0) {
      const message = "Сначала последовательно обрежьте все фотографии (1, 2, 3 ...).";
      setErrorMessage(message);
      toast.error(message);
      setCropperEditIndex(null);
      setCropperInitialIndex(0);
      setIsCropperOpen(true);
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

      const formValues = form.getValues();
      const normalizedPrice = Number(formValues.price);
      const normalizedCategories = (formValues.categoryIds ?? [])
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      const attributesPayload = buildProductAttributePayload(
        productAttributes,
        formValues.attributes ?? {},
      );

      const createPayloadCandidate = {
        name: formValues.name.trim(),
        price: normalizedPrice,
        brandId: normalizeOptionalString(formValues.brandId),
        mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
        categories:
          normalizedCategories.length > 0 ? normalizedCategories : undefined,
        attributes: attributesPayload.length > 0 ? attributesPayload : undefined,
      };

      const createPayloadParsed = ProductControllerCreateBody.safeParse(
        createPayloadCandidate,
      );
      if (!createPayloadParsed.success) {
        throw new Error(
          formatGeneratedZodError(
            createPayloadParsed.error,
            "Форма содержит некорректные данные для создания товара.",
          ),
        );
      }

      await createProduct.mutateAsync({
        data: createPayloadParsed.data,
      });

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
    createProduct,
    files,
    form,
    isInitialCropRequired,
    isSubmitting,
    pendingAddedFiles.length,
    productAttributes,
    queryClient,
    resetState,
    uploadImagesAndResolveMediaIds,
    uploadedMediaIds,
    validateForm,
  ]);

  const handleCropperOpenChange = React.useCallback((nextOpen: boolean) => {
    setIsCropperOpen(nextOpen);
    if (!nextOpen) {
      setCropperEditIndex(null);
    }
  }, []);

  const handleReset = React.useCallback(() => {
    if (isSubmitting) {
      return;
    }

    resetState();
  }, [isSubmitting, resetState]);

  return {
    cropperApplyLabel,
    cropperDescription,
    cropperFiles,
    cropperInitialIndex,
    cropperMode,
    cropperTitle,
    errorMessage,
    filePreviewByFile,
    files,
    form,
    formFields,
    handleCropApply,
    handleCropperOpenChange,
    handleEditFile,
    handleFilesChange,
    handleOpenChange,
    handleReset,
    handleSelectFileForSwap,
    handleSubmit,
    handleToggleReorderMode,
    isCropperOpen,
    isInitialCropRequired,
    isReorderMode,
    isSubmitting,
    open,
    pendingSwapIndex,
    removeFile,
    uploadState,
    uploadedMediaIds,
  };
}



