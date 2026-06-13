"use client";

import {
  buildCatalogExperienceSummary,
  type CatalogExperienceOption,
  getCatalogExperienceAvailableModes,
  getCatalogExperienceOption,
  getCatalogExperienceOptions,
  normalizeCatalogExperienceModes,
  resolveCatalogExperienceDefaultMode,
  type CatalogExperienceMode,
} from "@/core/widgets/edit-catalog-drawer/model/catalog-experience";
import {
  type CatalogEditFormValues,
} from "@/core/widgets/edit-catalog-drawer/model/form-config";
import { resolveCurrentAbsoluteUrl } from "@/core/widgets/share-drawer/model/share-drawer-helpers";
import { apiClient } from "@/shared/api/client";
import { copyTextToClipboard } from "@/shared/lib/clipboard";
import { useCatalogState } from "@/shared/providers/catalog-provider";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { FieldError } from "@/shared/ui/field";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { Switch } from "@/shared/ui/switch";
import { Check, ChevronRight, Copy, Download, ExternalLink, QrCode, RefreshCw } from "lucide-react";
import Image from "next/image";
import QRCodeLib from "qrcode";
import React from "react";
import { toast } from "sonner";
import { useWatch, type UseFormReturn } from "react-hook-form";

function buildModeUrl(mode: CatalogExperienceMode): string {
  const params = new URLSearchParams({ mode });
  return resolveCurrentAbsoluteUrl(`/?${params.toString()}`);
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

function buildHallTableUrl(table: {
  code: string;
}): string {
  const params = new URLSearchParams({
    mode: "HALL",
    t: table.code,
  });

  return resolveCurrentAbsoluteUrl(`/?${params.toString()}`);
}

function getIikoTableLabel(table: IikoRestaurantTableOption): string {
  if (table.name?.trim()) return table.name.trim();

  const iikoNumber =
    table.number !== null && table.number !== undefined
      ? String(table.number)
      : table.displayNumber;

  return iikoNumber ? `Стол ${iikoNumber}` : table.name ?? "Стол";
}

function getIikoTableDetails(table: IikoRestaurantTableOption): string[] {
  const details: string[] = [];
  if (table.sectionName) {
    details.push(table.sectionName);
  }
  if (table.seatingCapacity) {
    details.push(`${table.seatingCapacity} мест`);
  }
  return details;
}

function buildSiteUrl(): string {
  return resolveCurrentAbsoluteUrl("/");
}

function buildQrFileName(label: string): string {
  const normalized =
    label
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "table";
  return `qr-${normalized}.png`;
}

function createBlobFromDataUrl(dataUrl: string): Blob {
  const separatorIndex = dataUrl.indexOf(",");
  if (separatorIndex === -1) {
    throw new Error("Invalid data URL");
  }

  const header = dataUrl.slice(0, separatorIndex);
  const data = dataUrl.slice(separatorIndex + 1);
  const mimeType = header.match(/^data:([^;]+)/)?.[1] ?? "application/octet-stream";
  const isBase64 = header.includes(";base64");
  const binary = isBase64 ? window.atob(data) : decodeURIComponent(data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

function downloadDataUrl(dataUrl: string, fileName: string): void {
  const blobUrl = window.URL.createObjectURL(createBlobFromDataUrl(dataUrl));
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
}

function QrPngDownloadButton({
  dataUrl,
  fileName,
}: {
  dataUrl: string;
  fileName: string;
}) {
  const handleDownload = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      try {
        downloadDataUrl(dataUrl, fileName);
      } catch {
        toast.error("Не удалось скачать PNG.");
      }
    },
    [dataUrl, fileName],
  );

  return (
    <button
      type="button"
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={handleDownload}
    >
      <Download className="size-4" />
      Скачать PNG
    </button>
  );
}

function useQrDataUrl(url: string): string | null {
  const [dataUrl, setDataUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!url) {
      setDataUrl(null);
      return;
    }

    let isCancelled = false;
    void QRCodeLib.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).then((nextDataUrl) => {
      if (!isCancelled) setDataUrl(nextDataUrl);
    });

    return () => {
      isCancelled = true;
    };
  }, [url]);

  return dataUrl;
}

function ModeLinkRow({
  disabled,
  isDefaultMode,
  isEnabled,
  isLastSelected,
  onDefaultChange,
  onToggle,
  option,
}: {
  disabled?: boolean;
  isDefaultMode: boolean;
  isEnabled: boolean;
  isLastSelected: boolean;
  onDefaultChange: () => void;
  onToggle: (checked: boolean) => void;
  option: CatalogExperienceOption;
}) {
  const [copied, setCopied] = React.useState(false);
  const url = React.useMemo(
    () => buildModeUrl(option.value),
    [option.value],
  );
  const qrDataUrl = useQrDataUrl(url);

  const handleCopy = React.useCallback(async () => {
    if (!isEnabled) {
      return;
    }

    try {
      await copyTextToClipboard(url);
      setCopied(true);
      toast.success("Ссылка скопирована.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать ссылку.");
    }
  }, [isEnabled, url]);

  const handleOpen = React.useCallback(() => {
    if (!isEnabled) {
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }, [isEnabled, url]);

  return (
    <div className="rounded-2xl border border-black/10 px-4 py-3">
      <div className="flex items-start gap-3">
        <Switch
          checked={isEnabled}
          disabled={disabled || isLastSelected}
          className="mt-0.5 shrink-0 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
          onCheckedChange={onToggle}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">{option.title}</p>
            {isDefaultMode ? (
              <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                По умолчанию
              </Badge>
            ) : null}
            {!isEnabled ? (
              <Badge variant="secondary" className="bg-red-500/10 text-red-700">
                Выключен
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 wrap-break-word text-sm text-muted-foreground">
            {option.description}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{url}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!isEnabled}
            onClick={() => void handleCopy()}
            title="Скопировать ссылку"
          >
            {copied ? (
              <Check className="size-4 text-green-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!isEnabled}
            onClick={handleOpen}
            title="Открыть в новой вкладке"
          >
            <ExternalLink className="size-4" />
          </Button>

          <Popover modal>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!isEnabled}
                title="Показать QR-код"
              >
                <QrCode className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="pointer-events-auto w-auto p-4">
              <p className="mb-3 text-sm font-medium">{option.title}</p>
              {qrDataUrl ? (
                <>
                  <Image
                    src={qrDataUrl}
                    alt={`QR-код для режима ${option.title}`}
                    className="size-48 rounded-lg"
                    width={192}
                    height={192}
                    unoptimized
                  />
                  <QrPngDownloadButton
                    dataUrl={qrDataUrl}
                    fileName={`qr-${option.value.toLowerCase()}.png`}
                  />
                </>
              ) : (
                <div className="flex size-48 items-center justify-center text-muted-foreground">
                  <QrCode className="size-8 animate-pulse" />
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <button
        type="button"
        aria-pressed={isDefaultMode}
        disabled={disabled || !isEnabled}
        onClick={onDefaultChange}
        className="mt-3 flex w-full items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span
          aria-hidden="true"
          className="flex size-4 shrink-0 items-center justify-center rounded-full border border-primary"
        >
          {isDefaultMode ? (
            <span className="size-2 rounded-full bg-primary" />
          ) : null}
        </span>
        <span className="font-medium text-foreground">
          Открывать по умолчанию
        </span>
        <span className="min-w-0 flex-1 truncate text-muted-foreground">
          ссылка на сайт
        </span>
      </button>
    </div>
  );
}

function SiteLinkRow({
  defaultModeTitle,
  disabled,
}: {
  defaultModeTitle: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);
  const url = React.useMemo(() => buildSiteUrl(), []);
  const qrDataUrl = useQrDataUrl(url);

  const handleCopy = React.useCallback(async () => {
    try {
      await copyTextToClipboard(url);
      setCopied(true);
      toast.success("Ссылка скопирована.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать ссылку.");
    }
  }, [url]);

  const handleOpen = React.useCallback(() => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, [url]);

  return (
    <div className="rounded-2xl border border-black/10 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">Сайт</p>
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-700">
              {defaultModeTitle}
            </Badge>
          </div>
          <p className="mt-1 wrap-break-word text-sm text-muted-foreground">
            Обычная ссылка на каталог. Открывает сценарий по умолчанию.
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{url}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => void handleCopy()}
            title="Скопировать ссылку"
          >
            {copied ? (
              <Check className="size-4 text-green-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={handleOpen}
            title="Открыть в новой вкладке"
          >
            <ExternalLink className="size-4" />
          </Button>

          <Popover modal>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                title="Показать QR-код"
              >
                <QrCode className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="pointer-events-auto w-auto p-4">
              <p className="mb-3 text-sm font-medium">Сайт</p>
              {qrDataUrl ? (
                <>
                  <Image
                    src={qrDataUrl}
                    alt="QR-код для сайта"
                    className="size-48 rounded-lg"
                    width={192}
                    height={192}
                    unoptimized
                  />
                  <QrPngDownloadButton dataUrl={qrDataUrl} fileName="qr-site.png" />
                </>
              ) : (
                <div className="flex size-48 items-center justify-center text-muted-foreground">
                  <QrCode className="size-8 animate-pulse" />
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

function HallTableCard({
  table,
}: {
  table: IikoRestaurantTableOption;
}) {
  const [copied, setCopied] = React.useState(false);
  const [qrOpen, setQrOpen] = React.useState(false);
  const tableCode = table.publicCode?.trim() ?? "";
  const url = React.useMemo(
    () => (tableCode ? buildHallTableUrl({ code: tableCode }) : ""),
    [tableCode],
  );
  const label = getIikoTableLabel(table);
  const details = getIikoTableDetails(table);
  const qrDataUrl = useQrDataUrl(qrOpen ? url : "");
  const isActionEnabled = Boolean(url);

  const handleCopy = React.useCallback(async () => {
    if (!url) return;

    try {
      await copyTextToClipboard(url);
      setCopied(true);
      toast.success("QR-ссылка стола скопирована.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать ссылку.");
    }
  }, [url]);

  const handleOpen = React.useCallback(() => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [url]);

  return (
    <div className="rounded-lg border border-black/10 px-3 py-2 text-sm">
      <div className="flex min-w-0 items-start gap-3">
        <div className="min-w-0 flex-1">
          <span className="block font-medium">{label}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {details.join(" · ") ||
              (tableCode ? "Без секции" : "Нет короткого кода")}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!isActionEnabled}
            onClick={() => void handleCopy()}
            title="Скопировать ссылку"
            className="size-8"
          >
            {copied ? (
              <Check className="size-4 text-green-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!isActionEnabled}
            onClick={handleOpen}
            title="Открыть в новой вкладке"
            className="size-8"
          >
            <ExternalLink className="size-4" />
          </Button>

          <Popover modal open={qrOpen} onOpenChange={setQrOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!isActionEnabled}
                title="QR и PNG"
                className="size-8"
              >
                <Download className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="pointer-events-auto w-auto p-4">
              <p className="mb-3 text-sm font-medium">{label}</p>
              {qrDataUrl ? (
                <>
                  <Image
                    src={qrDataUrl}
                    alt={`QR-код для ${label}`}
                    className="size-52 rounded-lg border bg-white p-2"
                    width={208}
                    height={208}
                    unoptimized
                  />
                  <QrPngDownloadButton
                    dataUrl={qrDataUrl}
                    fileName={buildQrFileName(label)}
                  />
                </>
              ) : (
                <div className="flex size-52 items-center justify-center rounded-lg border text-muted-foreground">
                  <QrCode className="size-8 animate-pulse" />
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

function HallTableQrDrawer({
  disabled,
}: {
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [tables, setTables] = React.useState<IikoRestaurantTableOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadTables = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<IikoRestaurantTablesResponse>(
        "/integration/iiko/tables",
      );
      setTables(response.tables);
    } catch (error) {
      setTables([]);
      toast.error(
        error instanceof Error
          ? error.message
          : "Не удалось загрузить столы iiko.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;
    void loadTables();
  }, [loadTables, open]);

  return (
    <AppDrawer
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center gap-2"
          disabled={disabled}
        >
          <QrCode className="size-4" />
          QR-код стола
        </Button>
      }
    >
      <AppDrawer.Content className="max-h-[92dvh]">
        <AppDrawer.Header
          title="QR-код для стола"
          description="Ссылка откроет каталог в режиме заказа в зале, а настоящий iiko UUID стола останется на сервере."
        />

        <DrawerScrollArea>
          <div className="space-y-5 px-4 pb-4">
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Столы iiko</h3>
                  <p className="text-sm text-muted-foreground">
                    Берем список из настроенной группы терминалов.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isLoading}
                  onClick={() => void loadTables()}
                  title="Обновить столы"
                >
                  <RefreshCw className={isLoading ? "size-4 animate-spin" : "size-4"} />
                </Button>
              </div>

              {tables.length > 0 ? (
                <div className="grid gap-2">
                  {tables.map((table) => (
                    <HallTableCard key={table.id} table={table} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-black/10 p-3 text-sm text-muted-foreground">
                  Столы не загрузились. Проверьте выбранную группу терминалов iiko и обновите список.
                </div>
              )}
            </section>
          </div>
        </DrawerScrollArea>
      </AppDrawer.Content>
    </AppDrawer>
  );
}

type EditCatalogExperienceDrawerProps = {
  form: UseFormReturn<CatalogEditFormValues>;
  disabled?: boolean;
  isSaving?: boolean;
  onSave?: () => Promise<boolean>;
};

function buildNextAllowedModes(params: {
  checked: boolean;
  current: CatalogExperienceMode[];
  mode: CatalogExperienceMode;
}): CatalogExperienceMode[] {
  const { checked, current, mode } = params;

  if (checked) {
    return normalizeCatalogExperienceModes([...current, mode]);
  }

  return current.filter((item) => item !== mode);
}

export const EditCatalogExperienceDrawer: React.FC<
  EditCatalogExperienceDrawerProps
> = ({ form, disabled = false, isSaving = false, onSave }) => {
  const { catalog } = useCatalogState();
  const [open, setOpen] = React.useState(false);
  const allowedModesValue = useWatch({
    control: form.control,
    name: "allowedModes",
  });
  const defaultModeValue = useWatch({
    control: form.control,
    name: "defaultMode",
  });
  const availableOptions = React.useMemo(
    () => getCatalogExperienceOptions(catalog),
    [catalog],
  );
  const availableModes = React.useMemo(
    () => getCatalogExperienceAvailableModes(catalog),
    [catalog],
  );
  const canUseHallMode = availableModes.includes("HALL");
  const allowedModes = React.useMemo(
    () =>
      normalizeCatalogExperienceModes(allowedModesValue, {
        availableModes,
      }),
    [allowedModesValue, availableModes],
  );
  const defaultMode = React.useMemo(
    () => resolveCatalogExperienceDefaultMode(defaultModeValue, allowedModes),
    [allowedModes, defaultModeValue],
  );
  const summary = React.useMemo(
    () =>
      buildCatalogExperienceSummary({
        allowedModes,
        defaultMode,
      }),
    [allowedModes, defaultMode],
  );
  const defaultModeTitle = React.useMemo(
    () => getCatalogExperienceOption(defaultMode).title,
    [defaultMode],
  );
  const allowedModesError = form.formState.errors.allowedModes?.message;
  const defaultModeError = form.formState.errors.defaultMode?.message;

  const handleAllowedModeChange = React.useCallback(
    (mode: CatalogExperienceMode, checked: boolean) => {
      const currentModes = normalizeCatalogExperienceModes(
        form.getValues("allowedModes"),
        { availableModes },
      );
      const nextAllowedModes = buildNextAllowedModes({
        checked,
        current: currentModes,
        mode,
      }).filter((item) => availableModes.includes(item));

      if (!checked && nextAllowedModes.length === 0) {
        return;
      }

      form.setValue("allowedModes", nextAllowedModes, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      const currentDefaultMode = resolveCatalogExperienceDefaultMode(
        form.getValues("defaultMode"),
        currentModes,
      );
      const nextDefaultMode = checked
        ? resolveCatalogExperienceDefaultMode(currentDefaultMode, nextAllowedModes)
        : currentDefaultMode === mode
          ? resolveCatalogExperienceDefaultMode(undefined, nextAllowedModes)
          : resolveCatalogExperienceDefaultMode(currentDefaultMode, nextAllowedModes);

      form.setValue("defaultMode", nextDefaultMode, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [availableModes, form],
  );

  const handleDefaultModeChange = React.useCallback(
    (mode: string) => {
      const nextDefaultMode = resolveCatalogExperienceDefaultMode(mode, allowedModes);
      form.setValue("defaultMode", nextDefaultMode, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [allowedModes, form],
  );
  const handleSave = React.useCallback(async () => {
    const isSaved = await onSave?.();
    if (isSaved) {
      setOpen(false);
    }
  }, [onSave]);

  return (
    <AppDrawer
      open={open}
      onOpenChange={setOpen}
      dismissible={!disabled && !isSaving}
      trigger={
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full min-w-0 items-start justify-between rounded-2xl border border-black/10 px-4 py-4 text-left whitespace-normal hover:bg-muted/30"
          disabled={disabled}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="max-w-full wrap-break-word text-left whitespace-normal"
              >
                {summary.badge}
              </Badge>
            </div>
            <p className="mt-1 wrap-break-word text-sm text-muted-foreground whitespace-normal">
              {summary.description}
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      }
    >
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Сценарий заказа"
            description={
              canUseHallMode
                ? "Выберите, как клиенты будут пользоваться каталогом: оформлять доставку, только смотреть каталог или собирать заказ для зала."
                : "Выберите, как клиенты будут пользоваться каталогом: оформлять доставку или только смотреть каталог."
            }
            withCloseButton={!disabled && !isSaving}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="space-y-6">
              <section className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Режимы заказа</h3>
                  <p className="text-sm text-muted-foreground">
                    Включайте нужные сценарии и выберите, что открывать по ссылке на сайт.
                  </p>
                </div>

                <div className="space-y-2">
                  <SiteLinkRow
                    defaultModeTitle={defaultModeTitle}
                    disabled={disabled}
                  />
                  {availableOptions.map((option) => {
                    const isEnabled = allowedModes.includes(option.value);
                    const isLastSelected = isEnabled && allowedModes.length === 1;

                    return (
                      <ModeLinkRow
                        key={option.value}
                        disabled={disabled}
                        isDefaultMode={option.value === defaultMode}
                        isEnabled={isEnabled}
                        isLastSelected={isLastSelected}
                        onDefaultChange={() => handleDefaultModeChange(option.value)}
                        onToggle={(checked) =>
                          handleAllowedModeChange(option.value, checked)
                        }
                        option={option}
                      />
                    );
                  })}
                  {canUseHallMode && allowedModes.includes("HALL") ? (
                    <HallTableQrDrawer disabled={disabled} />
                  ) : null}
                </div>

                {allowedModesError ? (
                  <FieldError>{allowedModesError}</FieldError>
                ) : null}
                {defaultModeError ? (
                  <FieldError>{defaultModeError}</FieldError>
                ) : null}
              </section>
            </div>
          </DrawerScrollArea>

          <AppDrawer.Footer
            className="border-t"
            btnText="Сохранить"
            isAutoClose={false}
            loading={isSaving}
            handleClick={() => void handleSave()}
            buttonType="button"
          />
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
