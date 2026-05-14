"use client";

import { invalidateProductQueries } from "@/core/modules/product/actions/model";
import {
  type InventoryMovementDto,
  type InventoryReservationDto,
  type InventoryStockBalanceDto,
  type InventoryWarehouseDto,
  getInventoryControllerGetWarehouseBalancesQueryKey,
  getInventoryControllerGetWarehouseMovementsQueryKey,
  getInventoryControllerGetWarehouseReservationsQueryKey,
  useInventoryControllerAdjustWarehouseStock,
  useInventoryControllerGetWarehouseBalances,
  useInventoryControllerGetWarehouseMovements,
  useInventoryControllerGetWarehouseReservations,
  useInventoryControllerGetWarehouses,
} from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import React from "react";
import { toast } from "sonner";

type InventoryDetailView = "balances" | "movements" | "reservations";
type InventoryOperationMode = "receipt" | "writeOff" | "adjustment";

const MANUAL_VARIANT_VALUE = "__manual__";

const OPERATION_MODE_LABELS: Record<InventoryOperationMode, string> = {
  receipt: "Приход",
  writeOff: "Списание",
  adjustment: "Коррекция",
};

function formatQuantity(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 3,
  }).format(value);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getWarehouseStatusLabel(status: InventoryWarehouseDto["status"]) {
  return status === "ACTIVE" ? "Активен" : "Отключен";
}

function getBalanceName(balance: InventoryStockBalanceDto) {
  return (
    balance.variant?.product.name ??
    balance.variant?.sku ??
    balance.variantId
  );
}

function getVariantLabel(balance: InventoryStockBalanceDto) {
  const name = getBalanceName(balance);
  const sku = balance.variant?.sku;

  return sku && sku !== name ? `${name} (${sku})` : name;
}

function getMovementTitle(movement: InventoryMovementDto) {
  const reason = movement.reason?.trim();

  if (reason) return reason;

  return `${movement.type} / ${movement.source}`;
}

function getReservationTitle(reservation: InventoryReservationDto) {
  return (
    reservation.variant?.product.name ??
    reservation.variant?.sku ??
    reservation.variantId
  );
}

function getReservationMeta(reservation: InventoryReservationDto) {
  if (reservation.orderId) return `Заказ: ${reservation.orderId}`;
  if (reservation.cartId) return `Корзина: ${reservation.cartId}`;

  return reservation.cartItemId ?? reservation.id;
}

function getOperationQuantityDelta(
  mode: InventoryOperationMode,
  quantity: number,
) {
  if (mode === "writeOff") return -Math.abs(quantity);
  if (mode === "receipt") return Math.abs(quantity);

  return quantity;
}

function InventoryOperationPanel({
  selectedWarehouseId,
}: {
  selectedWarehouseId: string;
}) {
  const queryClient = useQueryClient();
  const [mode, setMode] = React.useState<InventoryOperationMode>("receipt");
  const [selectedVariantId, setSelectedVariantId] = React.useState("");
  const [manualVariantId, setManualVariantId] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [reason, setReason] = React.useState("");

  const balancesQuery = useInventoryControllerGetWarehouseBalances(
    selectedWarehouseId,
    {
      query: {
        enabled: Boolean(selectedWarehouseId),
        staleTime: 15_000,
      },
    },
  );
  const adjustStockMutation = useInventoryControllerAdjustWarehouseStock<
    unknown
  >();

  const balances = React.useMemo(
    () => balancesQuery.data ?? [],
    [balancesQuery.data],
  );
  const variantId =
    selectedVariantId === MANUAL_VARIANT_VALUE
      ? manualVariantId.trim()
      : selectedVariantId;
  const isSubmitting = adjustStockMutation.isPending;

  React.useEffect(() => {
    if (selectedVariantId || !balances.length) return;

    setSelectedVariantId(balances[0].variantId);
  }, [balances, selectedVariantId]);

  React.useEffect(() => {
    setSelectedVariantId("");
    setManualVariantId("");
    setQuantity("");
    setReason("");
  }, [selectedWarehouseId]);

  async function invalidateInventory() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getInventoryControllerGetWarehouseBalancesQueryKey(
          selectedWarehouseId,
        ),
      }),
      queryClient.invalidateQueries({
        queryKey: getInventoryControllerGetWarehouseMovementsQueryKey(
          selectedWarehouseId,
        ),
      }),
      queryClient.invalidateQueries({
        queryKey: getInventoryControllerGetWarehouseReservationsQueryKey(
          selectedWarehouseId,
        ),
      }),
      invalidateProductQueries(queryClient),
    ]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedQuantity = Number(quantity.replace(",", "."));
    if (!variantId) {
      toast.error("Выберите вариант или укажите variantId.");
      return;
    }
    if (!Number.isFinite(parsedQuantity) || parsedQuantity === 0) {
      toast.error("Укажите ненулевое количество.");
      return;
    }

    try {
      await adjustStockMutation.mutateAsync({
        id: selectedWarehouseId,
        data: {
          variantId,
          quantityDelta: getOperationQuantityDelta(mode, parsedQuantity),
          reason: reason.trim() || OPERATION_MODE_LABELS[mode],
        },
      });
      await invalidateInventory();
      setQuantity("");
      setReason("");
      toast.success(`${OPERATION_MODE_LABELS[mode]} сохранен.`);
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    }
  }

  return (
    <form className="grid gap-3 rounded-lg border px-3 py-3" onSubmit={handleSubmit}>
      <div className="flex flex-wrap gap-2">
        {(["receipt", "writeOff", "adjustment"] as const).map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={mode === item ? "default" : "outline"}
            onClick={() => setMode(item)}
          >
            {OPERATION_MODE_LABELS[item]}
          </Button>
        ))}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="inventory-variant">Вариант</Label>
        <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
          <SelectTrigger id="inventory-variant">
            <SelectValue placeholder="Выберите вариант" />
          </SelectTrigger>
          <SelectContent>
            {balances.map((balance) => (
              <SelectItem key={balance.id} value={balance.variantId}>
                {getVariantLabel(balance)}
              </SelectItem>
            ))}
            <SelectItem value={MANUAL_VARIANT_VALUE}>Указать variantId</SelectItem>
          </SelectContent>
        </Select>
        {balancesQuery.isError ? (
          <p className="text-xs text-destructive">
            Не удалось загрузить варианты из остатков.
          </p>
        ) : null}
      </div>

      {selectedVariantId === MANUAL_VARIANT_VALUE || !balances.length ? (
        <div className="grid gap-2">
          <Label htmlFor="inventory-manual-variant">variantId</Label>
          <Input
            id="inventory-manual-variant"
            value={manualVariantId}
            onChange={(event) => setManualVariantId(event.target.value)}
            placeholder="ID варианта"
            disabled={isSubmitting}
          />
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="inventory-quantity">
            {mode === "adjustment" ? "Изменение" : "Количество"}
          </Label>
          <Input
            id="inventory-quantity"
            type="number"
            step="0.001"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder={mode === "adjustment" ? "-2 или 5" : "1"}
            disabled={isSubmitting}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="inventory-reason">Причина</Label>
          <Input
            id="inventory-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={OPERATION_MODE_LABELS[mode]}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Сохраняем..." : "Сохранить движение"}
      </Button>
    </form>
  );
}

function InventoryDetailPanel({
  activeView,
  selectedWarehouseId,
}: {
  activeView: InventoryDetailView;
  selectedWarehouseId: string;
}) {
  const balancesQuery = useInventoryControllerGetWarehouseBalances(
    selectedWarehouseId,
    {
      query: {
        enabled: activeView === "balances" && Boolean(selectedWarehouseId),
        staleTime: 15_000,
      },
    },
  );
  const movementsQuery = useInventoryControllerGetWarehouseMovements(
    selectedWarehouseId,
    {
      query: {
        enabled: activeView === "movements" && Boolean(selectedWarehouseId),
        staleTime: 15_000,
      },
    },
  );
  const reservationsQuery = useInventoryControllerGetWarehouseReservations(
    selectedWarehouseId,
    {
      query: {
        enabled: activeView === "reservations" && Boolean(selectedWarehouseId),
        staleTime: 15_000,
      },
    },
  );

  if (activeView === "balances") {
    if (balancesQuery.isLoading) {
      return <p className="text-sm text-muted-foreground">Загружаем остатки...</p>;
    }

    if (balancesQuery.isError) {
      return (
        <p className="text-sm text-destructive">Не удалось загрузить остатки.</p>
      );
    }

    const balances = balancesQuery.data ?? [];

    if (!balances.length) {
      return <p className="text-sm text-muted-foreground">Остатков пока нет.</p>;
    }

    return (
      <div className="grid gap-2">
        {balances.map((balance) => (
          <div key={balance.id} className="rounded-lg border px-3 py-2 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {getBalanceName(balance)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {balance.variant?.sku ?? balance.variantId}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div>{formatQuantity(balance.quantityAvailable)}</div>
                <div className="text-xs text-muted-foreground">доступно</div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>На складе: {formatQuantity(balance.quantityOnHand)}</span>
              <span>Резерв: {formatQuantity(balance.quantityReserved)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activeView === "reservations") {
    if (reservationsQuery.isLoading) {
      return <p className="text-sm text-muted-foreground">Загружаем резервы...</p>;
    }

    if (reservationsQuery.isError) {
      return (
        <p className="text-sm text-destructive">Не удалось загрузить резервы.</p>
      );
    }

    const reservations = reservationsQuery.data ?? [];

    if (!reservations.length) {
      return <p className="text-sm text-muted-foreground">Резервов пока нет.</p>;
    }

    return (
      <div className="grid gap-2">
        {reservations.map((reservation) => (
          <div key={reservation.id} className="rounded-lg border px-3 py-2 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {getReservationTitle(reservation)}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {getReservationMeta(reservation)}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div>{formatQuantity(reservation.quantity)}</div>
                <Badge variant="secondary">{reservation.status}</Badge>
              </div>
            </div>
            <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
              {reservation.expiresAt ? (
                <span>Истекает: {formatDateTime(reservation.expiresAt)}</span>
              ) : null}
              {reservation.releasedAt ? (
                <span>Снят: {formatDateTime(reservation.releasedAt)}</span>
              ) : null}
              {reservation.consumedAt ? (
                <span>Списан: {formatDateTime(reservation.consumedAt)}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (movementsQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Загружаем движения...</p>;
  }

  if (movementsQuery.isError) {
    return (
      <p className="text-sm text-destructive">Не удалось загрузить движения.</p>
    );
  }

  const movements = movementsQuery.data ?? [];

  if (!movements.length) {
    return <p className="text-sm text-muted-foreground">Движений пока нет.</p>;
  }

  return (
    <div className="grid gap-2">
      {movements.map((movement) => (
        <div key={movement.id} className="rounded-lg border px-3 py-2 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">
                {getMovementTitle(movement)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDateTime(movement.occurredAt)}
              </div>
            </div>
            <div className="shrink-0 text-right font-medium">
              {movement.quantityDelta > 0 ? "+" : ""}
              {formatQuantity(movement.quantityDelta)}
            </div>
          </div>
          {movement.quantityAfter != null ? (
            <div className="mt-2 text-xs text-muted-foreground">
              После движения: {formatQuantity(movement.quantityAfter)}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export const EditCatalogInventoryDrawer: React.FC<{
  disabled?: boolean;
}> = ({ disabled = false }) => {
  const [open, setOpen] = React.useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState("");
  const [activeView, setActiveView] =
    React.useState<InventoryDetailView>("balances");
  const warehousesQuery = useInventoryControllerGetWarehouses({
    query: {
      enabled: open,
      staleTime: 30_000,
    },
  });
  const warehouses = React.useMemo(
    () => warehousesQuery.data ?? [],
    [warehousesQuery.data],
  );

  React.useEffect(() => {
    if (!selectedWarehouseId && warehouses.length) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [selectedWarehouseId, warehouses]);

  const selectedWarehouse =
    warehouses.find((warehouse) => warehouse.id === selectedWarehouseId) ?? null;

  return (
    <AppDrawer
      nested
      open={open}
      onOpenChange={setOpen}
      dismissible={!disabled}
      trigger={
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full min-w-0 items-start justify-between rounded-2xl border border-black/10 px-4 py-4 text-left whitespace-normal hover:bg-muted/30"
          disabled={disabled}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">Склад</span>
              <Badge variant="secondary">Внутренний учет</Badge>
            </div>
            <p className="mt-1 break-words text-sm text-muted-foreground whitespace-normal">
              Склады, остатки, резервы и журнал движений текущего каталога.
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      }
    >
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Склад"
            description="Просматривайте внутренние склады, остатки, резервы и создавайте ручные движения."
            withCloseButton={!disabled}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            {warehousesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Загружаем склады...</p>
            ) : null}

            {warehousesQuery.isError ? (
              <p className="text-sm text-destructive">
                Не удалось загрузить склады.
              </p>
            ) : null}

            {!warehousesQuery.isLoading &&
            !warehousesQuery.isError &&
            !warehouses.length ? (
              <p className="text-sm text-muted-foreground">Складов пока нет.</p>
            ) : null}

            {warehouses.length ? (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  {warehouses.map((warehouse) => {
                    const isSelected = warehouse.id === selectedWarehouseId;

                    return (
                      <button
                        key={warehouse.id}
                        type="button"
                        className="rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted/30 data-[selected=true]:border-primary"
                        data-selected={isSelected}
                        onClick={() => setSelectedWarehouseId(warehouse.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {warehouse.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {warehouse.code}
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {getWarehouseStatusLabel(warehouse.status)}
                          </Badge>
                        </div>
                        {warehouse.address ? (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {warehouse.address}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {selectedWarehouse ? (
                  <div className="grid gap-3">
                    <InventoryOperationPanel
                      selectedWarehouseId={selectedWarehouse.id}
                    />

                    <div className="flex flex-wrap gap-2">
                      {(["balances", "movements", "reservations"] as const).map(
                        (view) => (
                          <Button
                            key={view}
                            type="button"
                            size="sm"
                            variant={activeView === view ? "default" : "outline"}
                            onClick={() => setActiveView(view)}
                          >
                            {view === "balances"
                              ? "Остатки"
                              : view === "movements"
                                ? "Движения"
                                : "Резервы"}
                          </Button>
                        ),
                      )}
                    </div>

                    <InventoryDetailPanel
                      activeView={activeView}
                      selectedWarehouseId={selectedWarehouse.id}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
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
