"use client";

import {
  buildCatalogExperienceSummary,
  CATALOG_EXPERIENCE_OPTIONS,
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
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Switch } from "@/shared/ui/switch";
import { Check, ChevronRight, Copy, Download, ExternalLink, QrCode } from "lucide-react";
import QRCodeLib from "qrcode";
import React from "react";
import { toast } from "sonner";
import { useWatch, type UseFormReturn } from "react-hook-form";

function buildModeUrl(mode: CatalogExperienceMode): string {
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

function ModeLinkRow({ mode, title }: { mode: CatalogExperienceMode; title: string }) {
  const [copied, setCopied] = React.useState(false);
  const url = React.useMemo(() => buildModeUrl(mode), [mode]);
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
    <div className="flex items-center gap-2 rounded-2xl border border-black/10 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{url}</p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
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
        className="shrink-0"
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
            className="shrink-0"
            title="Показать QR-код"
          >
            <QrCode className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-4">
          <p className="mb-3 text-sm font-medium">{title}</p>
          {qrDataUrl ? (
            <>
              <img
                src={qrDataUrl}
                alt={`QR-код для режима ${title}`}
                className="size-48 rounded-lg"
              />
              <a
                href={qrDataUrl}
                download={`qr-${mode.toLowerCase()}.png`}
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
  );
}

type EditCatalogExperienceDrawerProps = {
  form: UseFormReturn<CatalogEditFormValues>;
  disabled?: boolean;
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
> = ({ form, disabled = false }) => {
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

  return (
    <AppDrawer
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
              <span className="text-sm font-medium text-foreground">
                Сценарий заказа
              </span>
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
      <AppDrawer.Content className="mx-auto w-full max-w-xl">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Сценарий заказа"
            description="Выберите, как клиенты будут пользоваться каталогом: оформлять доставку, только смотреть каталог или собирать заказ для зала."
            withCloseButton={!disabled}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="space-y-6">
              <section className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Доступные сценарии</h3>
                  <p className="text-sm text-muted-foreground">
                    Можно включить один или несколько вариантов работы каталога.
                  </p>
                </div>

                <div className="space-y-3">
                  {CATALOG_EXPERIENCE_OPTIONS.map((option) => {
                    const isChecked = allowedModes.includes(option.value);
                    const isLastSelected = isChecked && allowedModes.length === 1;

                    return (
                      <label
                        key={option.value}
                        className="flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-black/10 px-4 py-4 transition-colors hover:bg-muted/30"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {option.title}
                              </p>
                              <p className="mt-1 wrap-break-word text-sm text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                            <Switch
                              checked={isChecked}
                              disabled={disabled || isLastSelected}
                              className="shrink-0"
                              onCheckedChange={(checked) =>
                                handleAllowedModeChange(option.value, checked)
                              }
                            />
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {allowedModesError ? (
                  <FieldError>{allowedModesError}</FieldError>
                ) : null}
              </section>

              <section className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">
                    Что открывать по умолчанию
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Этот вариант будет открываться первым, если клиент не выбрал другой формат по ссылке.
                  </p>
                </div>

                <RadioGroup
                  value={defaultMode}
                  onValueChange={handleDefaultModeChange}
                  className="space-y-3"
                >
                  {allowedModes.map((mode) => {
                    const option = CATALOG_EXPERIENCE_OPTIONS.find(
                      (item) => item.value === mode,
                    );

                    if (!option) {
                      return null;
                    }

                    return (
                      <label
                        key={mode}
                        className="flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-black/10 px-4 py-4 transition-colors hover:bg-muted/30"
                      >
                        <RadioGroupItem
                          value={mode}
                          disabled={disabled}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {option.title}
                          </p>
                          <p className="mt-1 wrap-break-word text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </RadioGroup>

                {defaultModeError ? (
                  <FieldError>{defaultModeError}</FieldError>
                ) : null}
              </section>

              <section className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Ссылки для клиентов</h3>
                  <p className="text-sm text-muted-foreground">
                    Готовые ссылки с нужным сценарием — скопируйте и отправьте клиентам.
                  </p>
                </div>

                <div className="space-y-2">
                  {allowedModes.map((mode) => {
                    const option = CATALOG_EXPERIENCE_OPTIONS.find(
                      (item) => item.value === mode,
                    );

                    if (!option) {
                      return null;
                    }

                    return (
                      <ModeLinkRow
                        key={mode}
                        mode={mode}
                        title={option.title}
                      />
                    );
                  })}
                </div>
              </section>
            </div>
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
