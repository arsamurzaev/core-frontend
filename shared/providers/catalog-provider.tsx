"use client";
import { ApiClientError } from "@/shared/api/client";
import {
  type CatalogContactDto,
  type CatalogContactDtoType,
  useCatalogControllerGetCurrent,
  type CatalogControllerGetCurrentQueryResult,
} from "@/shared/api/generated";
import {
  getPrimaryCatalogContact,
  getPrimaryCatalogContactValue,
  groupCatalogContacts,
  normalizeCatalogContacts,
  type CatalogContactsByType,
} from "@/shared/lib/catalog-contacts";
import { createStrictContext, useStrictContext } from "@/shared/lib/react";
import React, { PropsWithChildren, useMemo } from "react";

type CatalogStatus = "loading" | "ready" | "missing" | "error";

export type CatalogWithContacts = CatalogControllerGetCurrentQueryResult & {
  contacts: CatalogContactDto[];
  contactsByType: CatalogContactsByType;
  getContactByType: (type: CatalogContactDtoType) => CatalogContactDto | undefined;
  getContactValue: (type: CatalogContactDtoType) => string | undefined;
};

export type CatalogStateValue = {
  catalog: CatalogWithContacts | undefined;
  status: CatalogStatus;
  isLoading: boolean;
  isReady: boolean;
  isMissing: boolean;
  hasCatalog: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
};

const CatalogContext = createStrictContext<CatalogStateValue>();

type CatalogProviderProps = PropsWithChildren<{
  initialCatalog?: CatalogControllerGetCurrentQueryResult | null;
}>;

function isMissingCatalogError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof ApiClientError) {
    return error.status === 401 || error.status === 404;
  }

  if (typeof error === "object" && error !== null) {
    const axiosLike = error as { response?: { status?: number } };
    const status = axiosLike.response?.status;
    return status === 401 || status === 404;
  }

  return false;
}

export const CatalogProvider: React.FC<CatalogProviderProps> = ({
  children,
  initialCatalog,
}) => {
  const hasInitialCatalog =
    initialCatalog !== undefined && initialCatalog !== null;
  const query = useCatalogControllerGetCurrent({
    query: {
      ...(hasInitialCatalog ? { initialData: initialCatalog } : {}),
      retry: false,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });

  const missing = isMissingCatalogError(query.error);
  const rawCatalog = missing ? undefined : query.data;
  const normalizedContacts = useMemo(
    () => normalizeCatalogContacts(rawCatalog?.contacts),
    [rawCatalog?.contacts],
  );
  const contactsByType = useMemo(
    () => groupCatalogContacts(normalizedContacts),
    [normalizedContacts],
  );
  const catalog = useMemo<CatalogWithContacts | undefined>(() => {
    if (!rawCatalog) {
      return undefined;
    }

    return {
      ...rawCatalog,
      contacts: normalizedContacts,
      contactsByType,
      getContactByType: (type) => getPrimaryCatalogContact(contactsByType, type),
      getContactValue: (type) => getPrimaryCatalogContactValue(contactsByType, type),
    };
  }, [contactsByType, normalizedContacts, rawCatalog]);

  const status: CatalogStatus = query.isLoading
    ? "loading"
    : missing
      ? "missing"
      : catalog
        ? "ready"
        : query.error
          ? "error"
          : "missing";

  const value = useMemo<CatalogStateValue>(
    () => ({
      catalog,
      status,
      isLoading: query.isLoading,
      isReady: status === "ready",
      isMissing: status === "missing",
      hasCatalog: Boolean(catalog),
      error: missing ? null : query.error,
      refetch: query.refetch,
    }),
    [catalog, status, query.isLoading, query.error, query.refetch, missing],
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
};

export function useCatalogState(): CatalogStateValue {
  return useStrictContext(CatalogContext);
}

export function useCatalog(): CatalogWithContacts {
  const { catalog, status } = useCatalogState();
  if (!catalog) {
    throw new Error(`Catalog is not ready. Current status: ${status}`);
  }
  return catalog;
}
