import { revalidateStorefrontCacheBestEffort } from "@/shared/api/revalidate-storefront-client";
import {
  uploadCatalogImage,
  type MediaUploadState,
} from "@/core/widgets/edit-catalog-drawer/lib/upload-media";
import { type CatalogEditFormValues } from "@/core/widgets/edit-catalog-drawer/model/form-config";
import { getCatalogControllerGetCurrentQueryKey } from "@/shared/api/generated/react-query";
import { type QueryClient } from "@tanstack/react-query";

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
  await Promise.allSettled([
    queryClient.invalidateQueries({
      queryKey: getCatalogControllerGetCurrentQueryKey(),
    }),
    revalidateStorefrontCacheBestEffort(),
  ]);
}
