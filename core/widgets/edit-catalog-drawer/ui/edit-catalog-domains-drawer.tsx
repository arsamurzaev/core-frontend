"use client";

import {
  CatalogDomainDtoStatus,
  getCatalogAdvancedSettingsControllerListDomainsQueryKey,
  useCatalogAdvancedSettingsControllerCheckDomain,
  useCatalogAdvancedSettingsControllerCreateDomain,
  useCatalogAdvancedSettingsControllerDisableDomain,
  useCatalogAdvancedSettingsControllerListDomains,
  type CatalogDomainDnsRecordDto,
  type CatalogDomainDto,
} from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { copyTextToClipboard } from "@/shared/lib/clipboard";
import { cn } from "@/shared/lib/utils";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  CircleCheck,
  Clock3,
  Copy,
  Globe2,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";

type DomainStatusMeta = {
  label: string;
  badgeVariant: React.ComponentProps<typeof Badge>["variant"];
  className?: string;
};

const STATUS_META: Record<string, DomainStatusMeta> = {
  [CatalogDomainDtoStatus.ACTIVE]: {
    label: "Активен",
    badgeVariant: "default",
  },
  [CatalogDomainDtoStatus.PENDING_DNS]: {
    label: "Ждет DNS",
    badgeVariant: "secondary",
    className: "text-amber-700",
  },
  [CatalogDomainDtoStatus.DNS_VERIFIED]: {
    label: "DNS проверен",
    badgeVariant: "secondary",
  },
  [CatalogDomainDtoStatus.FAILED]: {
    label: "Ошибка",
    badgeVariant: "destructive",
  },
  [CatalogDomainDtoStatus.DISABLED]: {
    label: "Отключен",
    badgeVariant: "outline",
  },
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function getStatusMeta(status: string): DomainStatusMeta {
  return (
    STATUS_META[status] ?? {
      label: status,
      badgeVariant: "outline",
    }
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "еще не проверялся";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "нет данных";

  return dateFormatter.format(date);
}

function formatRecheckSeconds(seconds: number | undefined) {
  const minutes = Math.max(1, Math.ceil((seconds ?? 300) / 60));
  return `${minutes} мин.`;
}

async function copyValue(value: string) {
  try {
    await copyTextToClipboard(value);
    toast.success("Скопировано.");
  } catch {
    toast.error("Не удалось скопировать.");
  }
}

function DomainRecordRow({ record }: { record: CatalogDomainDnsRecordDto }) {
  return (
    <div className="grid gap-2 rounded-lg border border-black/10 bg-background p-3 text-sm">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge variant={record.required ? "default" : "secondary"}>
          {record.type}
        </Badge>
        <Badge variant="outline">
          {record.required ? "обязательно" : "вариант"}
        </Badge>
      </div>

      <div className="grid gap-1">
        <div className="text-xs text-muted-foreground">Имя</div>
        <div className="flex min-w-0 items-center gap-2">
          <code className="min-w-0 flex-1 break-all rounded-md bg-muted px-2 py-1 text-xs">
            {record.name}
          </code>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 shrink-0"
            onClick={() => void copyValue(record.name)}
          >
            <Copy className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-1">
        <div className="text-xs text-muted-foreground">Значение</div>
        <div className="flex min-w-0 items-center gap-2">
          <code className="min-w-0 flex-1 break-all rounded-md bg-muted px-2 py-1 text-xs">
            {record.value}
          </code>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 shrink-0"
            onClick={() => void copyValue(record.value)}
          >
            <Copy className="size-4" />
          </Button>
        </div>
      </div>

      {record.description ? (
        <p className="break-words text-xs leading-5 text-muted-foreground">
          {record.description}
        </p>
      ) : null}
    </div>
  );
}

function DomainRecords({ domain }: { domain: CatalogDomainDto }) {
  const records = [
    domain.verification.txtRecord,
    ...domain.verification.routingRecords,
    domain.verification.wwwRecord,
  ].filter(Boolean) as CatalogDomainDnsRecordDto[];

  return (
    <div className="grid gap-3">
      <div className="rounded-lg border border-black/10 bg-muted/30 p-3 text-sm text-muted-foreground">
        Сначала добавьте TXT для подтверждения владения. Для маршрутизации
        выберите один подходящий вариант: A/AAAA на IP сервера или
        ALIAS/ANAME/CNAME на платформенный target.
      </div>

      <div className="grid gap-3">
        {records.map((record) => (
          <DomainRecordRow
            key={`${record.type}:${record.name}:${record.value}`}
            record={record}
          />
        ))}
      </div>
    </div>
  );
}

function DomainCard({
  domain,
  disabled,
  checkingId,
  disablingId,
  onCheck,
  onDisable,
}: {
  domain: CatalogDomainDto;
  disabled: boolean;
  checkingId: string | null;
  disablingId: string | null;
  onCheck: (id: string) => void;
  onDisable: (id: string) => void;
}) {
  const statusMeta = getStatusMeta(domain.status);
  const isChecking = checkingId === domain.id;
  const isDisabling = disablingId === domain.id;
  const isDisabled = domain.status === CatalogDomainDtoStatus.DISABLED;

  return (
    <div className="rounded-lg border border-black/10 bg-background p-4 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
          {domain.status === CatalogDomainDtoStatus.ACTIVE ? (
            <CircleCheck className="size-5" />
          ) : (
            <Globe2 className="size-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="min-w-0 break-all text-sm font-semibold text-foreground">
              {domain.hostname}
            </h3>
            <Badge
              variant={statusMeta.badgeVariant}
              className={cn("rounded-full px-2 py-1", statusMeta.className)}
            >
              {statusMeta.label}
            </Badge>
            {domain.includeWww ? (
              <Badge variant="secondary" className="rounded-full px-2 py-1">
                www
              </Badge>
            ) : null}
          </div>

          <p className="mt-2 break-words text-sm leading-5 text-muted-foreground">
            {domain.message}
          </p>

          {domain.lastError ? (
            <p className="mt-2 break-words rounded-lg bg-destructive/10 p-2 text-xs leading-5 text-destructive">
              {domain.lastError}
            </p>
          ) : null}

          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Clock3 className="size-4" />
            <span>Последняя проверка: {formatDate(domain.lastCheckedAt)}</span>
            <span>
              Повтор: через {formatRecheckSeconds(domain.nextCheckAfterSeconds)}
            </span>
          </div>
        </div>
      </div>

      {!isDisabled ? (
        <div className="mt-4">
          <DomainRecords domain={domain} />
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled || isDisabled || isChecking}
          onClick={() => onCheck(domain.id)}
        >
          {isChecking ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Проверить DNS
        </Button>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={disabled || isDisabled || isDisabling}
          onClick={() => onDisable(domain.id)}
        >
          {isDisabling ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          Отключить
        </Button>
      </div>
    </div>
  );
}

const DomainsSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 2 }, (_, index) => (
      <div
        key={index}
        className="rounded-lg border border-black/10 bg-background p-4"
      >
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const EditCatalogDomainsDrawer: React.FC<{
  disabled?: boolean;
}> = ({ disabled = false }) => {
  const [open, setOpen] = React.useState(false);
  const [hostname, setHostname] = React.useState("");
  const [includeWww, setIncludeWww] = React.useState(true);
  const [checkingId, setCheckingId] = React.useState<string | null>(null);
  const [disablingId, setDisablingId] = React.useState<string | null>(null);
  const queryClient = useQueryClient();
  const queryKey = React.useMemo(
    () => getCatalogAdvancedSettingsControllerListDomainsQueryKey(),
    [],
  );

  const domainsQuery = useCatalogAdvancedSettingsControllerListDomains({
    query: {
      enabled: open && !disabled,
      staleTime: 30_000,
    },
  });
  const createDomain = useCatalogAdvancedSettingsControllerCreateDomain();
  const checkDomain = useCatalogAdvancedSettingsControllerCheckDomain();
  const disableDomain = useCatalogAdvancedSettingsControllerDisableDomain();
  const domains = domainsQuery.data ?? [];
  const activeCount = domains.filter(
    (domain) => domain.status === CatalogDomainDtoStatus.ACTIVE,
  ).length;
  const isMutating =
    createDomain.isPending || checkDomain.isPending || disableDomain.isPending;

  const refreshDomains = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) void domainsQuery.refetch();
    },
    [domainsQuery],
  );

  const handleCreate = React.useCallback(async () => {
    const normalized = hostname.trim().toLowerCase();
    if (!normalized) {
      toast.error("Укажите домен.");
      return;
    }

    try {
      await createDomain.mutateAsync({
        data: {
          hostname: normalized,
          includeWww,
        },
      });
      setHostname("");
      toast.success("Домен добавлен. Добавьте DNS-записи и запустите проверку.");
      await refreshDomains();
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    }
  }, [createDomain, hostname, includeWww, refreshDomains]);

  const handleCheck = React.useCallback(
    async (id: string) => {
      setCheckingId(id);
      try {
        const result = await checkDomain.mutateAsync({ id });
        if (result.ok) {
          toast.success(result.message);
        } else {
          toast.warning(result.message);
        }
        await refreshDomains();
      } catch (error) {
        toast.error(extractApiErrorMessage(error));
      } finally {
        setCheckingId(null);
      }
    },
    [checkDomain, refreshDomains],
  );

  const handleDisable = React.useCallback(
    async (id: string) => {
      setDisablingId(id);
      try {
        await disableDomain.mutateAsync({ id });
        toast.success("Домен отключен.");
        await refreshDomains();
      } catch (error) {
        toast.error(extractApiErrorMessage(error));
      } finally {
        setDisablingId(null);
      }
    },
    [disableDomain, refreshDomains],
  );

  return (
    <AppDrawer
      nested
      open={open}
      onOpenChange={handleOpenChange}
      dismissible={!isMutating}
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
                Домены
              </span>
              <Badge variant="secondary">
                {activeCount > 0 ? `${activeCount} активн.` : "Не подключено"}
              </Badge>
            </div>
            <p className="mt-1 break-words text-sm text-muted-foreground whitespace-normal">
              Подключите собственный домен к текущему каталогу и проверьте DNS.
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      }
    >
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Домены каталога"
            description="Добавьте домен, создайте DNS-записи у регистратора и запустите проверку подключения."
            withCloseButton={!isMutating}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <div className="space-y-4">
              <div className="rounded-lg border border-black/10 bg-background p-4">
                <div className="grid gap-3">
                  <Input
                    value={hostname}
                    disabled={isMutating}
                    placeholder="example.ru"
                    inputMode="url"
                    onChange={(event) => setHostname(event.target.value)}
                  />

                  <label className="flex min-w-0 items-start gap-3 text-sm leading-5 text-muted-foreground">
                    <Checkbox
                      checked={includeWww}
                      disabled={isMutating}
                      onCheckedChange={(checked) =>
                        setIncludeWww(checked === true)
                      }
                    />
                    <span className="min-w-0 break-words">
                      Также подключить www-версию домена
                    </span>
                  </label>

                  <Button
                    type="button"
                    className="w-full rounded-full"
                    disabled={isMutating}
                    onClick={() => void handleCreate()}
                  >
                    {createDomain.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    Добавить домен
                  </Button>
                </div>
              </div>

              {domainsQuery.isLoading ? <DomainsSkeleton /> : null}

              {domainsQuery.isError ? (
                <div className="rounded-lg border border-black/10 bg-muted/30 p-4 text-sm text-muted-foreground">
                  Не удалось загрузить домены.
                </div>
              ) : null}

              {!domainsQuery.isLoading &&
              !domainsQuery.isError &&
              domains.length === 0 ? (
                <div className="rounded-lg border border-black/10 bg-muted/30 p-4 text-sm text-muted-foreground">
                  К каталогу пока не привязан ни один собственный домен.
                </div>
              ) : null}

              {domains.length > 0 ? (
                <div className="space-y-3">
                  {domains.map((domain) => (
                    <DomainCard
                      key={domain.id}
                      domain={domain}
                      disabled={isMutating}
                      checkingId={checkingId}
                      disablingId={disablingId}
                      onCheck={handleCheck}
                      onDisable={handleDisable}
                    />
                  ))}
                </div>
              ) : null}
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
