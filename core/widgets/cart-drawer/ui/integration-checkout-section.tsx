"use client";

import { updateCheckoutData } from "@/core/widgets/cart-drawer/model/cart-checkout-data";
import {
  getIntegrationCheckoutFieldErrors,
  INTEGRATION_PERSONAL_DATA_POLICY_URL,
  INTEGRATION_PRIVACY_POLICY_URL,
  resolveEffectiveIntegrationCheckoutFields,
  type IntegrationCheckoutField,
} from "@/core/widgets/cart-drawer/model/integration-checkout";
import { apiClient } from "@/shared/api/client";
import {
  CHECKOUT_METHOD_LABELS,
  type CheckoutData,
  type CheckoutMethod,
} from "@/shared/lib/checkout-methods";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PhoneInput } from "@/shared/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { RefreshCw } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface IntegrationCheckoutSectionProps {
  availableMethods: CheckoutMethod[];
  checkoutData: CheckoutData;
  disabled?: boolean;
  fields: IntegrationCheckoutField[];
  method: CheckoutMethod;
  onDataChange: React.Dispatch<React.SetStateAction<CheckoutData>>;
  onMethodChange: (method: CheckoutMethod) => void;
  onPolicyAcceptedChange: (accepted: boolean) => void;
  policyAccepted: boolean;
  requirePolicyConsent?: boolean;
}

type IikoRestaurantTableOption = {
  id: string;
  publicCode: string | null;
  number: number | null;
  displayNumber: string | null;
  name: string | null;
  seatingCapacity: number | null;
  sectionId: string | null;
  sectionName: string | null;
  terminalGroupId: string | null;
};

type IikoRestaurantTablesResponse = {
  ok: true;
  tables: IikoRestaurantTableOption[];
  revision: number | null;
};

function hasField(
  fields: IntegrationCheckoutField[],
  field: IntegrationCheckoutField,
): boolean {
  return fields.includes(field);
}

function getHallTableLabel(data: CheckoutData): string {
  if (data.hallTableName ?? data.tableName) {
    return data.hallTableName ?? data.tableName ?? "Стол";
  }

  const tableNumber = data.hallTableNumber ?? data.tableNumber ?? data.table;
  if (tableNumber) return `Стол ${tableNumber}`;
  return "Стол";
}

function getIikoTableLabel(table: IikoRestaurantTableOption): string {
  const name = table.name?.trim();
  if (name) return name;

  const number =
    table.displayNumber ??
    (table.number !== null && table.number !== undefined
      ? String(table.number)
      : null);
  return number ? `Стол ${number}` : "Стол";
}

function getIikoTableDetails(table: IikoRestaurantTableOption): string {
  return table.sectionName?.trim() ?? "";
}

function normalizeTableRef(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

function tableMatchesRef(
  table: IikoRestaurantTableOption,
  ref: unknown,
): boolean {
  const expected = normalizeTableRef(ref);
  if (!expected) return false;

  const refs = [
    table.id,
    table.name,
    table.displayNumber,
    table.number,
  ].map(normalizeTableRef);
  return refs.some((value) => value === expected);
}

function applyIikoTableToCheckoutData(
  data: CheckoutData,
  table: IikoRestaurantTableOption,
): CheckoutData {
  const label = getIikoTableLabel(table);
  const tableNumber =
    table.displayNumber ??
    (table.number !== null && table.number !== undefined
      ? String(table.number)
      : undefined);

  return {
    ...data,
    hallTableId: table.id,
    iikoTableId: table.id,
    tableId: table.id,
    ...(table.publicCode
      ? {
          hallTableCode: table.publicCode,
          integrationExternalItemCode: table.publicCode,
          t: table.publicCode,
          tableCode: table.publicCode,
        }
      : {}),
    ...(table.sectionId
      ? {
          hallSectionId: table.sectionId,
          iikoRestaurantSectionId: table.sectionId,
        }
      : {}),
    ...(table.sectionName
      ? {
          hallSectionName: table.sectionName,
          iikoRestaurantSectionName: table.sectionName,
        }
      : {}),
    hallTableName: label,
    tableName: label,
    ...(tableNumber
      ? {
          hallTableNumber: tableNumber,
          table: tableNumber,
          tableNumber,
        }
      : {}),
  };
}

export const IntegrationCheckoutSection: React.FC<
  IntegrationCheckoutSectionProps
> = ({
  availableMethods,
  checkoutData,
  disabled = false,
  fields,
  method,
  onDataChange,
  onMethodChange,
  onPolicyAcceptedChange,
  policyAccepted,
  requirePolicyConsent = true,
}) => {
  const policyCheckboxId = React.useId();
  const effectiveFields = React.useMemo(
    () => resolveEffectiveIntegrationCheckoutFields({ fields, method }),
    [fields, method],
  );
  const [iikoTables, setIikoTables] = React.useState<
    IikoRestaurantTableOption[]
  >([]);
  const [isIikoTablesLoading, setIsIikoTablesLoading] = React.useState(false);
  const shouldShowMethod = hasField(effectiveFields, "checkoutMethod");
  const shouldShowHallTable = hasField(effectiveFields, "hallTable");
  const shouldShowPreorderTableInput =
    shouldShowHallTable && method === "PREORDER";
  const shouldShowPersonsCount = hasField(effectiveFields, "personsCount");
  const fieldErrors = React.useMemo(
    () =>
      getIntegrationCheckoutFieldErrors({
        data: checkoutData,
        fields: effectiveFields,
        method,
      }),
    [checkoutData, effectiveFields, method],
  );
  const hasCustomerFields =
    hasField(fields, "customerName") || hasField(fields, "phone");
  const hallTableLabel = getHallTableLabel(checkoutData);
  const isHallOrder = Boolean(
    method !== "PREORDER" &&
      (checkoutData.orderMode === "HALL" ||
        checkoutData.iikoTableId ||
        checkoutData.hallTableId ||
        checkoutData.integrationExternalItemCode ||
        checkoutData.hallTableCode ||
        checkoutData.tableCode ||
        checkoutData.t),
  );
  const selectedIikoTableId =
    checkoutData.iikoTableId ??
    checkoutData.hallTableId ??
    checkoutData.tableId ??
    "";
  const selectedIikoTable = React.useMemo(
    () => iikoTables.find((table) => table.id === selectedIikoTableId) ?? null,
    [iikoTables, selectedIikoTableId],
  );

  const loadIikoTables = React.useCallback(async () => {
    if (!shouldShowPreorderTableInput) return;

    setIsIikoTablesLoading(true);
    try {
      const response = await apiClient.get<IikoRestaurantTablesResponse>(
        "/integration/iiko/tables",
      );
      setIikoTables(response.tables.filter((table) => table.id));
    } catch (error) {
      setIikoTables([]);
      toast.error(
        error instanceof Error
          ? error.message
          : "Не удалось загрузить столы iiko.",
      );
    } finally {
      setIsIikoTablesLoading(false);
    }
  }, [shouldShowPreorderTableInput]);

  React.useEffect(() => {
    if (!shouldShowPreorderTableInput) return;
    void loadIikoTables();
  }, [loadIikoTables, shouldShowPreorderTableInput]);

  React.useEffect(() => {
    if (!shouldShowPreorderTableInput || iikoTables.length === 0) return;
    if (
      checkoutData.iikoTableId ||
      checkoutData.hallTableId ||
      checkoutData.tableId
    ) {
      return;
    }

    const tableRef =
      checkoutData.tableNumber ??
      checkoutData.hallTableNumber ??
      checkoutData.table ??
      checkoutData.tableName ??
      checkoutData.hallTableName;
    const table = iikoTables.find((item) => tableMatchesRef(item, tableRef));
    if (!table) return;

    onDataChange((current) => applyIikoTableToCheckoutData(current, table));
  }, [checkoutData, iikoTables, onDataChange, shouldShowPreorderTableInput]);

  const updateDraftData = React.useCallback(
    (key: keyof CheckoutData, value: string) => {
      onDataChange((current) => updateCheckoutData(current, key, value));
    },
    [onDataChange],
  );

  const handleIikoTableChange = React.useCallback(
    (tableId: string) => {
      const table = iikoTables.find((item) => item.id === tableId);
      if (!table) return;
      onDataChange((current) => applyIikoTableToCheckoutData(current, table));
    },
    [iikoTables, onDataChange],
  );

  return (
    <section className="space-y-4">
      {isHallOrder ? (
        <section className="rounded-lg border border-black/10 bg-muted/30 p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Заказ в зале
          </p>
          <p className="mt-1 text-base font-semibold">{hallTableLabel}</p>
          {checkoutData.iikoRestaurantSectionName ||
          checkoutData.hallSectionName ? (
            <p className="text-sm text-muted-foreground">
              {checkoutData.iikoRestaurantSectionName ??
                checkoutData.hallSectionName}
            </p>
          ) : null}
        </section>
      ) : null}

      {hasCustomerFields ? (
        <section className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {hasField(fields, "customerName") ? (
              <div className="space-y-2">
                <Label htmlFor="integration-checkout-customer-name">Имя</Label>
                <Input
                  id="integration-checkout-customer-name"
                  value={checkoutData.customerName ?? ""}
                  onChange={(event) =>
                    updateDraftData("customerName", event.target.value)
                  }
                  disabled={disabled}
                  placeholder="Иван"
                  className="border border-black/10"
                />
                {fieldErrors.customerName ? (
                  <p className="text-sm text-red-600">
                    {fieldErrors.customerName}
                  </p>
                ) : null}
              </div>
            ) : null}

            {hasField(fields, "phone") ? (
              <div className="space-y-2">
                <Label htmlFor="integration-checkout-phone">Телефон</Label>
                <PhoneInput
                  id="integration-checkout-phone"
                  value={checkoutData.phone ?? ""}
                  onValueChange={(value) => updateDraftData("phone", value)}
                  disabled={disabled}
                  placeholder="+7 999 000-00-00"
                  className="border border-black/10"
                />
                {fieldErrors.phone ? (
                  <p className="text-sm text-red-600">{fieldErrors.phone}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {shouldShowPreorderTableInput ? (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="integration-checkout-table-id">Стол iiko</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || isIikoTablesLoading}
              onClick={() => void loadIikoTables()}
              title="Обновить столы"
            >
              <RefreshCw
                className={
                  isIikoTablesLoading ? "size-4 animate-spin" : "size-4"
                }
              />
            </Button>
          </div>
          <Select
            value={selectedIikoTableId}
            onValueChange={handleIikoTableChange}
            disabled={disabled || isIikoTablesLoading || iikoTables.length === 0}
          >
            <SelectTrigger
              id="integration-checkout-table-id"
              className="border border-black/10"
            >
              <SelectValue
                placeholder={
                  isIikoTablesLoading ? "Загружаем столы" : "Выберите стол"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {iikoTables.map((table) => {
                const details = getIikoTableDetails(table);
                return (
                  <SelectItem key={table.id} value={table.id}>
                    {getIikoTableLabel(table)}
                    {details ? ` · ${details}` : ""}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {selectedIikoTable && getIikoTableDetails(selectedIikoTable) ? (
            <p className="text-sm text-muted-foreground">
              {getIikoTableDetails(selectedIikoTable)}
            </p>
          ) : !isIikoTablesLoading ? (
            <p className="text-sm text-muted-foreground">
              Обновите список и выберите стол из iiko.
            </p>
          ) : null}
          {fieldErrors.hallTable ? (
            <p className="text-sm text-red-600">{fieldErrors.hallTable}</p>
          ) : null}
        </section>
      ) : shouldShowHallTable ? (
        <section className="space-y-2">
          <p className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700">
            Откройте каталог по QR-коду конкретного стола. Для iiko нужен UUID
            стола, поэтому обычной ссылки режима зала недостаточно.
          </p>
          {fieldErrors.hallTable ? (
            <p className="text-sm text-red-600">{fieldErrors.hallTable}</p>
          ) : null}
        </section>
      ) : null}

      {shouldShowPersonsCount ? (
        <section className="space-y-2">
          <Label htmlFor="integration-checkout-persons-count">
            Количество гостей
          </Label>
          <Input
            id="integration-checkout-persons-count"
            type="number"
            min={1}
            max={999}
            inputMode="numeric"
            value={checkoutData.personsCount ?? checkoutData.guestsCount ?? ""}
            onChange={(event) =>
              updateDraftData("personsCount", event.target.value)
            }
            disabled={disabled}
            placeholder="2"
            className="border border-black/10"
          />
          {fieldErrors.personsCount ? (
            <p className="text-sm text-red-600">{fieldErrors.personsCount}</p>
          ) : null}
        </section>
      ) : null}

      {shouldShowMethod ? (
        <section className="space-y-3 rounded-lg border border-black/10 p-3">
          <h3 className="text-base font-semibold">Способ заказа</h3>
          <Tabs
            value={method}
            onValueChange={(value) => onMethodChange(value as CheckoutMethod)}
          >
            <TabsList
              className="grid h-auto w-full"
              style={{
                gridTemplateColumns: `repeat(${availableMethods.length}, minmax(0, 1fr))`,
              }}
            >
              {availableMethods.map((item) => (
                <TabsTrigger
                  key={item}
                  value={item}
                  disabled={disabled}
                  className="px-2 text-sm"
                >
                  {CHECKOUT_METHOD_LABELS[item]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {fieldErrors.checkoutMethod ? (
            <p className="text-sm text-red-600">
              {fieldErrors.checkoutMethod}
            </p>
          ) : null}
        </section>
      ) : null}

      {requirePolicyConsent ? (
        <div className="flex items-start gap-3 text-sm leading-snug">
          <Checkbox
            id={policyCheckboxId}
            checked={policyAccepted}
            disabled={disabled}
            onCheckedChange={(checked) =>
              onPolicyAcceptedChange(checked === true)
            }
            className="mt-0.5"
          />
          <p>
            <label htmlFor={policyCheckboxId} className="cursor-pointer">
              Я принимаю{" "}
            </label>
            <a
              href={INTEGRATION_PRIVACY_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              политику конфиденциальности
            </a>{" "}
            <label htmlFor={policyCheckboxId} className="cursor-pointer">
              и{" "}
            </label>
            <a
              href={INTEGRATION_PERSONAL_DATA_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              политику обработки персональных данных
            </a>
            .
          </p>
        </div>
      ) : null}
    </section>
  );
};
