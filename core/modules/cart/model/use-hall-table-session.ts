"use client";

import {
  createCartPublicAccess,
  type CartPublicAccess,
} from "@/core/modules/cart/model/cart-public-link";
import type { CartDto } from "@/shared/api/generated/react-query";
import { apiClient } from "@/shared/api/client";
import type { HallTableContext } from "@/shared/lib/hall-table";
import React from "react";

type JoinHallTableSessionResponse = {
  ok: true;
  tableSession: {
    cart: CartDto;
    guestSessionId: string;
    guestToken: string;
    publicKey: string;
  };
};

export type HallTableSessionClientState = {
  error: unknown;
  guestName: string | null;
  guestSessionId: string | null;
  guestToken: string | null;
  isJoining: boolean;
  needsGuestName: boolean;
  publicKey: string | null;
  submitGuestName: (guestName: string) => void;
  tableCode: string | null;
};

type HallTableSessionState = Omit<
  HallTableSessionClientState,
  "submitGuestName"
>;

interface UseHallTableSessionParams {
  catalogId: string;
  context: HallTableContext;
  enabled: boolean;
  persistPublicAccess: (access: CartPublicAccess) => void;
  setPublicCartData: (
    access: CartPublicAccess | null,
    cart: CartDto | null,
    options?: { ignoreStale?: boolean },
  ) => void;
  storedPublicAccess: CartPublicAccess | null;
}

function normalizeText(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

function buildHallTableGuestStorageKey(
  catalogId: string,
  tableCode: string,
): string {
  return `catalog-hall-table-guest:${catalogId}:${tableCode}`;
}

function buildHallTableGuestNameStorageKey(
  catalogId: string,
  tableCode: string,
): string {
  return `catalog-hall-table-guest-name:${catalogId}:${tableCode}`;
}

function buildHallTableGuestTokenStorageKey(
  catalogId: string,
  tableCode: string,
): string {
  return `catalog-hall-table-guest-token:${catalogId}:${tableCode}`;
}

function readStoredGuestSessionId(
  catalogId: string,
  tableCode: string,
): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return normalizeText(
    window.sessionStorage.getItem(
      buildHallTableGuestStorageKey(catalogId, tableCode),
    ),
  );
}

function readStoredGuestName(
  catalogId: string,
  tableCode: string,
): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return normalizeText(
    window.sessionStorage.getItem(
      buildHallTableGuestNameStorageKey(catalogId, tableCode),
    ),
  );
}

function readStoredGuestToken(
  catalogId: string,
  tableCode: string,
): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return normalizeText(
    window.sessionStorage.getItem(
      buildHallTableGuestTokenStorageKey(catalogId, tableCode),
    ),
  );
}

function storeGuestSessionId(
  catalogId: string,
  tableCode: string,
  guestSessionId: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    buildHallTableGuestStorageKey(catalogId, tableCode),
    guestSessionId,
  );
}

function storeGuestName(
  catalogId: string,
  tableCode: string,
  guestName: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    buildHallTableGuestNameStorageKey(catalogId, tableCode),
    guestName,
  );
}

function storeGuestToken(
  catalogId: string,
  tableCode: string,
  guestToken: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    buildHallTableGuestTokenStorageKey(catalogId, tableCode),
    guestToken,
  );
}

function isSameHallTableAccess(
  access: CartPublicAccess | null,
  tableCode: string | null,
): access is CartPublicAccess & {
  guestSessionId: string;
  guestToken: string;
  kind: "hallTable";
  tableCode: string;
} {
  return Boolean(
    access?.kind === "hallTable" &&
    tableCode &&
    access.tableCode === tableCode &&
    access.publicKey &&
    access.guestSessionId &&
    access.guestToken,
  );
}

export function useHallTableSession({
  catalogId,
  context,
  enabled,
  persistPublicAccess,
  setPublicCartData,
  storedPublicAccess,
}: UseHallTableSessionParams): HallTableSessionClientState {
  const tableCode = normalizeText(context.tableCode);
  const [guestNameRevision, setGuestNameRevision] = React.useState(0);
  const [state, setState] = React.useState<HallTableSessionState>({
    error: null,
    guestName: null,
    guestSessionId: null,
    guestToken: null,
    isJoining: false,
    needsGuestName: false,
    publicKey: null,
    tableCode: null,
  });

  const submitGuestName = React.useCallback(
    (value: string) => {
      const guestName = normalizeText(value)?.slice(0, 120);
      if (!tableCode || !guestName) {
        return;
      }

      storeGuestName(catalogId, tableCode, guestName);
      setGuestNameRevision((current) => current + 1);
    },
    [catalogId, tableCode],
  );

  React.useEffect(() => {
    if (!enabled || !tableCode) {
      setState((current) =>
        current.tableCode || current.publicKey || current.guestSessionId
          ? {
              error: null,
              guestName: null,
              guestSessionId: null,
              guestToken: null,
              isJoining: false,
              needsGuestName: false,
              publicKey: null,
              tableCode: null,
            }
          : current,
      );
      return;
    }

    const storedGuestSessionId = readStoredGuestSessionId(catalogId, tableCode);
    const storedGuestToken = readStoredGuestToken(catalogId, tableCode);
    const storedGuestName = readStoredGuestName(catalogId, tableCode);
    const sameAccess = isSameHallTableAccess(storedPublicAccess, tableCode);
    const guestName =
      normalizeText(storedPublicAccess?.guestName) ?? storedGuestName;

    if (!guestName) {
      setState({
        error: null,
        guestName: null,
        guestSessionId: sameAccess
          ? storedPublicAccess.guestSessionId
          : storedGuestSessionId,
        guestToken: sameAccess
          ? storedPublicAccess.guestToken
          : storedGuestToken,
        isJoining: false,
        needsGuestName: true,
        publicKey: sameAccess ? storedPublicAccess.publicKey : null,
        tableCode,
      });
      return;
    }

    if (sameAccess) {
      if (storedPublicAccess.guestName !== guestName) {
        persistPublicAccess(
          createCartPublicAccess(storedPublicAccess.publicKey, {
            guestName,
            guestSessionId: storedPublicAccess.guestSessionId,
            guestToken: storedPublicAccess.guestToken,
            kind: "hallTable",
            tableCode,
          }),
        );
      }
      setState({
        error: null,
        guestName,
        guestSessionId: storedPublicAccess.guestSessionId,
        guestToken: storedPublicAccess.guestToken,
        isJoining: false,
        needsGuestName: false,
        publicKey: storedPublicAccess.publicKey,
        tableCode,
      });
      return;
    }

    let isCancelled = false;

    setState({
      error: null,
      guestName,
      guestSessionId: storedGuestSessionId,
      guestToken: storedGuestToken,
      isJoining: true,
      needsGuestName: false,
      publicKey: null,
      tableCode,
    });

    void apiClient
      .post<JoinHallTableSessionResponse>(
        `/cart/hall-table/${encodeURIComponent(tableCode)}/session`,
        {
          ...(storedGuestSessionId
            ? { guestSessionId: storedGuestSessionId }
            : {}),
          ...(storedGuestToken ? { guestToken: storedGuestToken } : {}),
          guestName,
        },
      )
      .then((response) => {
        if (isCancelled) {
          return;
        }

        const guestSessionId = normalizeText(
          response.tableSession.guestSessionId,
        );
        const guestToken = normalizeText(response.tableSession.guestToken);
        const publicKey = normalizeText(response.tableSession.publicKey);

        if (!guestSessionId || !guestToken || !publicKey) {
          throw new Error("Hall table session response is invalid.");
        }

        storeGuestSessionId(catalogId, tableCode, guestSessionId);
        storeGuestToken(catalogId, tableCode, guestToken);

        const access = createCartPublicAccess(publicKey, {
          guestName,
          guestSessionId,
          guestToken,
          kind: "hallTable",
          tableCode,
        });

        persistPublicAccess(access);
        setPublicCartData(access, response.tableSession.cart, {
          ignoreStale: true,
        });
        setState({
          error: null,
          guestName,
          guestSessionId,
          guestToken,
          isJoining: false,
          needsGuestName: false,
          publicKey,
          tableCode,
        });
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        setState({
          error,
          guestName,
          guestSessionId: storedGuestSessionId,
          guestToken: storedGuestToken,
          isJoining: false,
          needsGuestName: false,
          publicKey: null,
          tableCode,
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [
    catalogId,
    enabled,
    guestNameRevision,
    persistPublicAccess,
    setPublicCartData,
    storedPublicAccess,
    tableCode,
  ]);

  return React.useMemo(
    () => ({
      ...state,
      submitGuestName,
    }),
    [state, submitGuestName],
  );
}
