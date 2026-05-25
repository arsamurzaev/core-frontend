"use client";

import { useSearchParams } from "next/navigation";
import React from "react";

import { apiClient } from "@/shared/api/client";

export type HallTableContext = {
  iikoRestaurantSectionId: string | null;
  iikoRestaurantSectionName: string | null;
  iikoTableId: string | null;
  tableCode: string | null;
  tableName: string | null;
  tableNumber: string | null;
};

type HallTableLookupResponse = {
  ok: true;
  table: {
    code: string;
    tableName: string | null;
    tableNumber: string | null;
    sectionId: string | null;
    sectionName: string | null;
  };
};

const EMPTY_HALL_TABLE_CONTEXT: HallTableContext = {
  iikoRestaurantSectionId: null,
  iikoRestaurantSectionName: null,
  iikoTableId: null,
  tableCode: null,
  tableName: null,
  tableNumber: null,
};

export function useHallTableContext(): HallTableContext {
  const searchParams = useSearchParams();
  const urlContext = React.useMemo(
    () => ({
      iikoRestaurantSectionId: readSearchParam(
        searchParams,
        "iikoSectionId",
        "sectionId",
        "hallSectionId",
      ),
      iikoRestaurantSectionName: readSearchParam(
        searchParams,
        "iikoSectionName",
        "sectionName",
        "hallSectionName",
      ),
      iikoTableId: readSearchParam(
        searchParams,
        "iikoTableId",
        "tableId",
        "hallTableId",
      ),
      tableCode: readSearchParam(
        searchParams,
        "t",
        "tableCode",
        "hallTableCode",
        "integrationExternalItemCode",
      ),
      tableName: readSearchParam(searchParams, "tableName", "hallTableName"),
      tableNumber: readSearchParam(
        searchParams,
        "table",
        "tableNumber",
        "hallTableNumber",
      ),
    }),
    [searchParams],
  );
  const [resolvedTable, setResolvedTable] =
    React.useState<HallTableLookupResponse["table"] | null>(null);

  React.useEffect(() => {
    const code = urlContext.tableCode;
    if (!code) {
      setResolvedTable(null);
      return;
    }

    let isCancelled = false;
    void apiClient
      .get<HallTableLookupResponse>(
        `/cart/hall-table/${encodeURIComponent(code)}`,
      )
      .then((response) => {
        if (!isCancelled) setResolvedTable(response.table);
      })
      .catch(() => {
        if (!isCancelled) setResolvedTable(null);
      });

    return () => {
      isCancelled = true;
    };
  }, [urlContext.tableCode]);

  return React.useMemo(() => {
    if (!resolvedTable || resolvedTable.code !== urlContext.tableCode) {
      return urlContext;
    }

    return {
      ...urlContext,
      iikoRestaurantSectionId:
        urlContext.iikoRestaurantSectionId ?? resolvedTable.sectionId,
      iikoRestaurantSectionName:
        urlContext.iikoRestaurantSectionName ?? resolvedTable.sectionName,
      tableName: urlContext.tableName ?? resolvedTable.tableName,
      tableNumber: urlContext.tableNumber ?? resolvedTable.tableNumber,
    };
  }, [resolvedTable, urlContext]);
}

export function buildHallTableCheckoutData(
  context: HallTableContext,
): Record<string, string> {
  const data: Record<string, string> = {
    orderMode: "HALL",
  };

  if (context.iikoTableId) {
    data.iikoTableId = context.iikoTableId;
    data.hallTableId = context.iikoTableId;
  }
  if (context.tableCode) {
    data.integrationExternalItemCode = context.tableCode;
    data.hallTableCode = context.tableCode;
    data.tableCode = context.tableCode;
    data.t = context.tableCode;
  }
  if (context.tableNumber) {
    data.table = context.tableNumber;
    data.tableNumber = context.tableNumber;
    data.hallTableNumber = context.tableNumber;
  }
  if (context.tableName) {
    data.tableName = context.tableName;
    data.hallTableName = context.tableName;
  }
  if (context.iikoRestaurantSectionId) {
    data.iikoRestaurantSectionId = context.iikoRestaurantSectionId;
    data.hallSectionId = context.iikoRestaurantSectionId;
  }
  if (context.iikoRestaurantSectionName) {
    data.iikoRestaurantSectionName = context.iikoRestaurantSectionName;
    data.hallSectionName = context.iikoRestaurantSectionName;
  }

  return data;
}

export function hasHallTableLink(context: HallTableContext): boolean {
  return Boolean(context.iikoTableId || context.tableCode);
}

export function getHallTableLabel(context: HallTableContext): string {
  if (context.tableName) return context.tableName;
  if (context.tableNumber) return `Стол ${context.tableNumber}`;
  return "Стол";
}

function readSearchParam(
  searchParams: URLSearchParams,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = searchParams.get(key)?.trim();
    if (value) return value;
  }

  return null;
}

export { EMPTY_HALL_TABLE_CONTEXT };
