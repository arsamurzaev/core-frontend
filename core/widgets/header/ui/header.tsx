"use client";

/* eslint-disable @next/next/no-img-element */

import { LazyCreateProductDrawerTrigger } from "@/core/widgets/header/ui/lazy-create-product-drawer-trigger";
import { LazyEditCatalogDrawerTrigger } from "@/core/widgets/header/ui/lazy-edit-catalog-drawer-trigger";
import { LazyGlobalAdminDrawerTrigger } from "@/core/widgets/header/ui/lazy-global-admin-drawer-trigger";
import { LazyShareDrawerTrigger } from "@/core/widgets/share-drawer";
import { useAuthControllerLogout } from "@/shared/api/generated/react-query";
import { canManageCatalogContent } from "@/core/catalog-runtime/content-access";
import { isGlobalAdminRole } from "@/shared/lib/catalog-role";
import type { CheckoutConfig } from "@/shared/lib/checkout-methods";
import { cn } from "@/shared/lib/utils";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { useSession } from "@/shared/providers/session-provider";
import { Button } from "@/shared/ui/button";
import { confirm } from "@/shared/ui/confirmation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Skeleton } from "@/shared/ui/skeleton";
import { ArrowRight } from "lucide-react";

import React from "react";
import { toast } from "sonner";

interface Props {
  className?: string;
  checkoutConfig?: CheckoutConfig;
  shareButtonLabel?: string;
  shareCopySuccessMessage?: string;
  supportsBrands?: boolean;
  supportsCategoryDetails?: boolean;
}

export const Header: React.FC<Props> = ({
  className,
  checkoutConfig,
  shareButtonLabel = "Поделиться каталогом",
  shareCopySuccessMessage = "Ссылка скопирована в буфер обмена",
  supportsBrands = true,
  supportsCategoryDetails = true,
}) => {
  const catalog = useCatalog();
  const { name, config, settings } = catalog;
  const about = config?.about;
  const logoMedia = config?.logoMedia;
  const description = config?.description;
  const address =
    typeof settings?.address === "string" ? settings.address.trim() : "";
  const {
    isAuthenticated,
    isLoading,
    user,
    hasGlobalAdminSession,
    isGlobalAdminMode,
    enterGlobalAdminMode,
    leaveGlobalAdminMode,
  } = useSession();
  const isGlobalAdmin = isGlobalAdminRole(user?.role);
  const canManageContent = canManageCatalogContent(catalog);
  const canEnterGlobalAdminMode = hasGlobalAdminSession && !isGlobalAdminMode;
  const showHeaderAuthAction = isAuthenticated || canEnterGlobalAdminMode;

  const logoutMutation = useAuthControllerLogout();

  const handleCopyCatalogLink = async () => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.origin);
      toast.success(shareCopySuccessMessage);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Не удалось скопировать ссылку",
      );
    }
  };

  const handleLogout = async () => {
    const shouldLogout = await confirm({
      title: "Выход",
      description: "Вы действительно хотите выйти?",
    });

    if (!shouldLogout) {
      return;
    }

    toast.promise(logoutMutation.mutateAsync(), {
      loading: "Выход...",
      success: () => "Выход выполнен",
      error: (error) =>
        error instanceof Error ? error.message : "Ошибка выхода",
    });
  };

  const handleEnterGlobalAdminMode = () => {
    toast.promise(enterGlobalAdminMode(), {
      loading: "Вход...",
      success: () => "Режим администратора включен",
      error: (error) =>
        error instanceof Error ? error.message : "Ошибка входа",
    });
  };

  const handleLeaveGlobalAdminMode = () => {
    toast.promise(leaveGlobalAdminMode(), {
      loading: "Переключение...",
      success: () => "Режим клиента включен",
      error: (error) =>
        error instanceof Error ? error.message : "Ошибка переключения",
    });
  };

  return (
    <header className={cn(className)}>
      <div className="space-y-6">
        <div className="-mt-5 flex items-start gap-5">
          <div className="relative">
            <div className="relative size-27.5 overflow-hidden rounded-pill border-[0.5px] border-line-subtle bg-surface-base shadow-surface sm:size-35">
              <img
                alt=""
                src={logoMedia?.url || "/default-avatar.png"}
                className="absolute inset-0 h-full w-full object-contain"
              />
            </div>
            {isAuthenticated ? (
              <LazyEditCatalogDrawerTrigger checkoutConfig={checkoutConfig} />
            ) : null}
          </div>

          <div className="pt-6 flex-1">
            <h1
              className={cn(
                "text-[18px] leading-tight font-bold text-text-primary sm:text-2xl",
                showHeaderAuthAction && "flex justify-between gap-3",
              )}
            >
              {name}
              {showHeaderAuthAction ? (
                <div className="flex shrink-0 items-start gap-2">
                  {canEnterGlobalAdminMode ? (
                    <button
                      onClick={handleEnterGlobalAdminMode}
                      className="flex h-fit items-center gap-1 text-xs text-action-primary underline"
                    >
                      Войти как администратор <ArrowRight className="size-3" />
                    </button>
                  ) : null}
                  {isGlobalAdminMode && isAuthenticated ? (
                    <button
                      onClick={handleLeaveGlobalAdminMode}
                      className="flex h-fit items-center gap-1 text-xs text-action-primary underline"
                    >
                      Клиент
                    </button>
                  ) : null}
                  {isAuthenticated && !canEnterGlobalAdminMode ? (
                    <button
                      onClick={handleLogout}
                      className="flex h-fit items-center gap-1 text-xs text-action-primary underline"
                    >
                      Выйти <ArrowRight className="size-3" />
                    </button>
                  ) : null}
                </div>
              ) : null}
            </h1>
            <h2 className="text-[12px] leading-tight whitespace-pre-line text-text-primary sm:text-base">
              {about || (
                <span className="text-text-muted">
                  Расскажи, чем занимаешься
                </span>
              )}
            </h2>
            <p className="text-[10px] whitespace-pre-line sm:text-sm">
              {description || (
                <span className="text-text-muted">
                  Опиши услуги или товары подробнее. <br />
                  Укажи свои сильные стороны и добавь график работы.
                </span>
              )}
            </p>
            {address ? (
              <p className="mt-1 text-[10px] leading-tight whitespace-pre-line text-text-muted sm:text-sm">
                {address}
              </p>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : isAuthenticated ? (
          <div className="grid grid-cols-2 gap-y-4 gap-x-2.5">
            {canManageContent ? (
              <LazyCreateProductDrawerTrigger
                supportsBrands={supportsBrands}
                supportsCategoryDetails={supportsCategoryDetails}
              />
            ) : null}
            <Button onClick={handleCopyCatalogLink} variant="outline" size="sm">
              {shareButtonLabel}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  Статистика аккаунта
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Статистика аккаунта</DialogTitle>
                  <DialogDescription>
                    Данная функция находится в разработке.
                  </DialogDescription>
                </DialogHeader>
                <p className="text-center text-xl leading-tight font-bold text-text-primary uppercase">
                  СКОРО ТУТ БУДЕТ МНОГО ИНТЕРЕСНОГО
                </p>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Понятно
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {isGlobalAdmin ? <LazyGlobalAdminDrawerTrigger /> : null}
          </div>
        ) : (
          <LazyShareDrawerTrigger />
        )}
      </div>
    </header>
  );
};
