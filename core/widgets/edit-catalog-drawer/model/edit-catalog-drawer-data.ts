import { formatGeneratedZodError } from "@/shared/lib/api-errors";
import {
  uploadCatalogImage,
  type MediaUploadState,
} from "@/core/widgets/edit-catalog-drawer/lib/upload-media";
import {
  buildCatalogEditUpdatePayload,
  catalogEditFormSchema,
  type CatalogEditFormValues,
} from "@/core/widgets/edit-catalog-drawer/model/form-config";
import { getCatalogControllerGetCurrentQueryKey } from "@/shared/api/generated";
import { CatalogControllerUpdateCurrentBody } from "@/shared/api/generated/zod";
import { type QueryClient } from "@tanstack/react-query";

export function parseCatalogEditFormValues(values: CatalogEditFormValues) {
  const parsedForm = catalogEditFormSchema.safeParse(values);
  if (!parsedForm.success) {
    throw new Error(
      formatGeneratedZodError(
        parsedForm.error,
        "Форма содержит некорректные данные профиля.",
      ),
    );
  }

  return parsedForm.data;
}

export async function uploadCatalogEditMediaIds(params: {
  catalogId: string;
  onStateChange: (state: MediaUploadState) => void;
  values: CatalogEditFormValues;
}) {
  const { catalogId, onStateChange, values } = params;

  const logoMediaId =
    values.logoFile instanceof File
      ? await uploadCatalogImage({
          file: values.logoFile,
          catalogId,
          kind: "logo",
          onStateChange,
        })
      : undefined;

  const bgMediaId =
    values.bgFile instanceof File
      ? await uploadCatalogImage({
          file: values.bgFile,
          catalogId,
          kind: "background",
          onStateChange,
        })
      : undefined;

  return {
    bgMediaId,
    logoMediaId,
  };
}

export function parseCatalogEditUpdatePayload(params: {
  bgMediaId?: string;
  logoMediaId?: string;
  values: CatalogEditFormValues;
}) {
  const payloadCandidate = buildCatalogEditUpdatePayload(params.values, {
    logoMediaId: params.logoMediaId,
    bgMediaId: params.bgMediaId,
  });
  const parsedPayload = CatalogControllerUpdateCurrentBody.safeParse(
    payloadCandidate,
  );

  if (!parsedPayload.success) {
    throw new Error(
      formatGeneratedZodError(
        parsedPayload.error,
        "Не удалось подготовить запрос на обновление профиля каталога.",
      ),
    );
  }

  return parsedPayload.data;
}

export function buildCatalogEditSubmittedValues(
  values: CatalogEditFormValues,
): CatalogEditFormValues {
  return {
    ...values,
    logoFile: undefined,
    bgFile: undefined,
  };
}

export async function invalidateCatalogEditQueries(queryClient: QueryClient) {
  await queryClient.invalidateQueries({
    queryKey: getCatalogControllerGetCurrentQueryKey(),
  });
}
