"use client";

import { createCartPublicAccess, useCart } from "@/core/modules/cart";
import type { CartDto } from "@/shared/api/generated/react-query";
import { apiClient } from "@/shared/api/client";
import { useCatalogCapabilities } from "@/shared/capabilities";
import { isCatalogManagerRole } from "@/shared/lib/catalog-role";
import { formatCatalogPrice } from "@/shared/lib/price-format";
import { cn, getCatalogCurrency } from "@/shared/lib/utils";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { useSession } from "@/shared/providers/session-provider";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { useQuery } from "@tanstack/react-query";
import { BellRing, RefreshCw, Table2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";

type HallTableOverview = {
  cart: CartDto | null;
  code: string;
  hasItems: boolean;
  itemsCount: number;
  needsConfirmation: boolean;
  publicKey: string | null;
  sectionName: string | null;
  session: CartDto["tableSession"] | null;
  tableName: string | null;
  tableNumber: string | null;
  total: number;
  updatedAt: string | null;
};

type HallTablesResponse = {
  ok: true;
  tables: HallTableOverview[];
};

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("ru-RU", {
      currency,
      maximumFractionDigits: 0,
      style: "currency",
    }).format(value);
  } catch {
    return `${formatCatalogPrice(value)} ${currency}`;
  }
}

function getTableTitle(table: HallTableOverview): string {
  const name = table.tableName?.trim();
  if (name) return name;

  const number = table.tableNumber?.trim();
  if (number) return `Стол ${number}`;
  return table.code;
}

function getTableSubtitle(table: HallTableOverview, currency: string): string {
  if (table.hasItems) {
    return `${table.itemsCount} поз. · ${formatMoney(table.total, currency)}`;
  }

  return table.sectionName || "Свободен";
}

export const HallTableOrdersDrawer: React.FC = () => {
  const catalog = useCatalog();
  const capabilities = useCatalogCapabilities();
  const { openPublicCart } = useCart();
  const { isAuthenticated, user } = useSession();
  const [open, setOpen] = React.useState(false);
  const currency = getCatalogCurrency(catalog, "RUB");
  const queryKey = React.useMemo(
    () => ["cart", "hall-tables", catalog.id] as const,
    [catalog.id],
  );
  const enabled =
    isAuthenticated &&
    isCatalogManagerRole(user?.role) &&
    capabilities.canUseIikoIntegration;

  const query = useQuery({
    enabled,
    queryFn: () => apiClient.get<HallTablesResponse>("/cart/hall-tables"),
    queryKey,
    refetchInterval: open ? 7_500 : 15_000,
  });
  const tables = query.data?.tables ?? [];
  const activeCount = tables.filter((table) => table.hasItems).length;

  const handleOpenTableCart = React.useCallback(
    (table: HallTableOverview) => {
      if (!table.publicKey) {
        toast.info("По этому столу пока нет корзины.");
        return;
      }

      openPublicCart(
        createCartPublicAccess(table.publicKey, {
          kind: "hallTable",
          tableCode: table.code,
        }),
        table.cart,
      );
      setOpen(false);
    },
    [openPublicCart],
  );

  if (!enabled) {
    return null;
  }

  return (
    <AppDrawer
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button
          className="fixed right-4 bottom-4 z-20 h-12 rounded-full px-4 shadow-lg"
          type="button"
        >
          <Table2 className="size-5" />
          Столы
          {activeCount > 0 ? (
            <span className="bg-background text-foreground ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs">
              {activeCount}
            </span>
          ) : null}
        </Button>
      }
    >
      <AppDrawer.Content className="max-h-[88vh] max-w-125">
        <AppDrawer.Header title="Столы iiko" description={null} />

        <div className="min-h-0 overflow-hidden px-4 pb-4">
          <div className="flex items-center justify-between pb-2">
            <span className="text-muted-foreground text-xs">
              {tables.length}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
              aria-label="Обновить столы"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>

          <div className="max-h-[68vh] space-y-2 overflow-y-auto pr-1">
            {tables.length ? (
              tables.map((table) => (
                <button
                  key={table.code}
                  className={cn(
                    "border-muted bg-background hover:bg-accent flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors",
                    !table.publicKey && "hover:bg-background",
                  )}
                  type="button"
                  onClick={() => handleOpenTableCart(table)}
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-md border",
                      table.hasItems
                        ? "border-primary text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {table.hasItems ? (
                      <BellRing className="size-4" />
                    ) : (
                      <Table2 className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {getTableTitle(table)}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {getTableSubtitle(table, currency)}
                    </span>
                  </span>
                  {table.hasItems ? (
                    <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[11px]">
                      заказ
                    </span>
                  ) : null}
                </button>
              ))
            ) : (
              <div className="text-muted-foreground rounded-md border p-4 text-sm">
                Столы не найдены.
              </div>
            )}
          </div>
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
