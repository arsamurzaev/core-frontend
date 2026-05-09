"use client";

import {
  buildCatalogExperienceSummary,
  CATALOG_EXPERIENCE_OPTIONS,
  type CatalogExperienceOption,
  normalizeCatalogExperienceModes,
  resolveCatalogExperienceDefaultMode,
  type CatalogExperienceMode,
} from "@/core/widgets/edit-catalog-drawer/model/catalog-experience";
import {
  type CatalogEditFormValues,
} from "@/core/widgets/edit-catalog-drawer/model/form-config";
import { resolveCurrentAbsoluteUrl } from "@/core/widgets/share-drawer/model/share-drawer-helpers";
import { copyTextToClipboard } from "@/shared/lib/clipboard";
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
import { Check, ChevronRight, Copy, Download, ExternalLink, QrCode } from "lucide-react";
import QRCodeLib from "qrcode";
import React from "react";
import { toast } from "sonner";
import { useWatch, type UseFormReturn } from "react-hook-form";

function buildModeUrl(mode: CatalogExperienceMode, isDefaultMode: boolean): string {
  if (isDefaultMode) {
    return resolveCurrentAbsoluteUrl("/");
  }

  const params = new URLSearchParams({ mode });
  return resolveCurrentAbsoluteUrl(`/?${params.toString()}`);
}

function useQrDataUrl(url: string): string | null {
  const [dataUrl, setDataUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!url) return;
    void QRCodeLib.toDataURL(url, { width: 256, margin: 2, color: { dark: "#000000", light: "#ffffff" } }).then(setDataUrl);
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
    () => buildModeUrl(option.value, isDefaultMode),
    [isDefaultMode, option.value],
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

          <Popover>
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
            <PopoverContent align="end" className="w-auto p-4">
              <p className="mb-3 text-sm font-medium">{option.title}</p>
              {qrDataUrl ? (
                <>
                  <img
                    src={qrDataUrl}
                    alt={`QR-код для режима ${option.title}`}
                    className="size-48 rounded-lg"
                  />
                  <a
                    href={qrDataUrl}
                    download={`qr-${option.value.toLowerCase()}.png`}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <Download className="size-4" />
                    Скачать PNG
                  </a>
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
          ссылка без параметров
        </span>
      </button>
    </div>
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
  const [open, setOpen] = React.useState(false);
  const allowedModesValue = useWatch({
    control: form.control,
    name: "allowedModes",
  });
  const defaultModeValue = useWatch({
    control: form.control,
    name: "defaultMode",
  });
  const allowedModes = React.useMemo(
    () => normalizeCatalogExperienceModes(allowedModesValue),
    [allowedModesValue],
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
  const allowedModesError = form.formState.errors.allowedModes?.message;
  const defaultModeError = form.formState.errors.defaultMode?.message;

  const handleAllowedModeChange = React.useCallback(
    (mode: CatalogExperienceMode, checked: boolean) => {
      const currentModes = normalizeCatalogExperienceModes(form.getValues("allowedModes"));
      const nextAllowedModes = buildNextAllowedModes({
        checked,
        current: currentModes,
        mode,
      });

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
    [form],
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
            description="Выберите, как клиенты будут пользоваться каталогом: оформлять доставку, только смотреть каталог или собирать заказ для зала."
            withCloseButton={!disabled && !isSaving}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="space-y-6">
              <section className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Режимы заказа</h3>
                  <p className="text-sm text-muted-foreground">
                    Включайте нужные сценарии и выберите, что открывать по ссылке без параметров.
                  </p>
                </div>

                <div className="space-y-2">
                  {CATALOG_EXPERIENCE_OPTIONS.map((option) => {
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
