"use client";

import {
  getCatalogAuthControllerSessionsListQueryKey,
  type AuthSessionDto,
  useCatalogAuthControllerRevokeOtherSessions,
  useCatalogAuthControllerRevokeSession,
  useCatalogAuthControllerSessionsList,
} from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { Skeleton } from "@/shared/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  Clock3,
  Globe2,
  Laptop,
  Loader2,
  MapPin,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Tablet,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface EditCatalogSessionsDrawerProps {
  disabled?: boolean;
}

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function getSessionDeviceLabel(session: AuthSessionDto) {
  const browser = session.client.browser?.name;
  const os = session.client.os?.name;
  const deviceModel = session.client.device?.model;

  if (deviceModel && browser) return `${deviceModel}, ${browser}`;
  if (browser && os) return `${browser}, ${os}`;
  if (browser) return browser;
  if (os) return os;
  return "Неизвестное устройство";
}

function getSessionLocationLabel(session: AuthSessionDto) {
  const city = session.client.geo?.city;
  const region = session.client.geo?.region;
  const ip = session.client.ip;

  if (city && region && city !== region) return `${city}, ${region}`;
  if (city) return city;
  if (region) return region;
  if (ip) return ip;
  return "Локация не определена";
}

function renderSessionIcon(session: AuthSessionDto) {
  const type = session.client.device?.type;

  if (type === "mobile") return <Smartphone className="size-5" />;
  if (type === "tablet") return <Tablet className="size-5" />;
  if (session.client.os?.name) return <Laptop className="size-5" />;
  return <Monitor className="size-5" />;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "нет данных";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "нет данных";

  return dateFormatter.format(date);
}

const SessionsSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }, (_, index) => (
      <div
        key={index}
        className="rounded-2xl border border-black/10 bg-background p-4"
      >
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

function SessionCard({
  session,
  isPending,
  onRevoke,
}: {
  session: AuthSessionDto;
  isPending: boolean;
  onRevoke: (sid: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-background p-4 shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
          {renderSessionIcon(session)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="min-w-0 break-words text-sm font-semibold text-foreground">
              {getSessionDeviceLabel(session)}
            </h3>
            {session.isCurrent ? (
              <Badge className="rounded-full px-2 py-1" variant="default">
                Текущая
              </Badge>
            ) : null}
          </div>

          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <div className="flex min-w-0 items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              <span className="min-w-0 truncate">
                {getSessionLocationLabel(session)}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <Clock3 className="size-4 shrink-0" />
              <span className="min-w-0 truncate">
                Вход: {formatDate(session.createdAt)}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <Globe2 className="size-4 shrink-0" />
              <span className="min-w-0 truncate">
                IP: {session.client.ip ?? "не определён"}
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            {session.isCurrent ? (
              <Button type="button" variant="secondary" size="sm" disabled>
                <ShieldCheck className="size-4" />
                Активна
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={isPending}
                onClick={() => onRevoke(session.id)}
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Сбросить
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const EditCatalogSessionsDrawer: React.FC<
  EditCatalogSessionsDrawerProps
> = ({ disabled = false }) => {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const sessionsQuery = useCatalogAuthControllerSessionsList({
    query: {
      enabled: !disabled,
      staleTime: 30_000,
    },
  });
  const revokeSession = useCatalogAuthControllerRevokeSession();
  const revokeOtherSessions = useCatalogAuthControllerRevokeOtherSessions();
  const sessions = sessionsQuery.data?.sessions ?? [];
  const otherSessionsCount = sessions.filter(
    (session) => !session.isCurrent,
  ).length;
  const isMutating = revokeSession.isPending || revokeOtherSessions.isPending;
  const queryKey = React.useMemo(
    () => getCatalogAuthControllerSessionsListQueryKey(),
    [],
  );
  const refetchSessions = sessionsQuery.refetch;

  const refreshSessions = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) void refetchSessions();
    },
    [refetchSessions],
  );

  const handleRevokeSession = React.useCallback(
    async (sid: string) => {
      try {
        await revokeSession.mutateAsync({ sid });
        toast.success("Сессия сброшена.");
        await refreshSessions();
      } catch (error) {
        toast.error(extractApiErrorMessage(error));
      }
    },
    [refreshSessions, revokeSession],
  );

  const handleRevokeOtherSessions = React.useCallback(async () => {
    if (otherSessionsCount === 0) return;

    try {
      await revokeOtherSessions.mutateAsync();
      toast.success("Остальные сессии сброшены.");
      await refreshSessions();
    } catch (error) {
      toast.error(extractApiErrorMessage(error));
    }
  }, [otherSessionsCount, refreshSessions, revokeOtherSessions]);

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
                Сессии
              </span>
              <Badge variant="secondary">
                {sessions.length > 0 ? `${sessions.length} активн.` : "Контроль"}
              </Badge>
            </div>
            <p className="mt-1 break-words text-sm text-muted-foreground whitespace-normal">
              Посмотрите устройства с доступом и сбросьте лишние входы.
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      }
    >
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Активные сессии"
            description="Текущая сессия остаётся активной, остальные можно сбросить по одной или все сразу."
            withCloseButton={!isMutating}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            {sessionsQuery.isLoading ? <SessionsSkeleton /> : null}

            {sessionsQuery.isError ? (
              <div className="rounded-2xl border border-black/10 bg-muted/30 p-4 text-sm text-muted-foreground">
                Не удалось загрузить список сессий.
              </div>
            ) : null}

            {!sessionsQuery.isLoading &&
            !sessionsQuery.isError &&
            sessions.length === 0 ? (
              <div className="rounded-2xl border border-black/10 bg-muted/30 p-4 text-sm text-muted-foreground">
                Активных сессий пока не найдено.
              </div>
            ) : null}

            {sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isPending={isMutating}
                    onRevoke={handleRevokeSession}
                  />
                ))}
              </div>
            ) : null}
          </DrawerScrollArea>

          <div className="border-t px-5 py-4">
            <Button
              type="button"
              className="w-full rounded-full"
              disabled={isMutating || otherSessionsCount === 0}
              onClick={() => void handleRevokeOtherSessions()}
            >
              {revokeOtherSessions.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Сбросить остальные
            </Button>
          </div>
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
