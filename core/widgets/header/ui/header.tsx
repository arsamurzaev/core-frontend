"use client";

import { LazyCreateProductDrawerTrigger } from "@/core/widgets/header/ui/lazy-create-product-drawer-trigger";
import { LazyEditCatalogDrawerTrigger } from "@/core/widgets/header/ui/lazy-edit-catalog-drawer-trigger";
import { LazyGlobalAdminDrawerTrigger } from "@/core/widgets/header/ui/lazy-global-admin-drawer-trigger";
import { LazyShareDrawerTrigger } from "@/core/widgets/share-drawer/ui/lazy-share-drawer-trigger";
import { useAuthControllerLogout } from "@/shared/api/generated/react-query";
import type { CheckoutConfig } from "@/shared/lib/checkout-methods";
import { isGlobalAdminRole } from "@/shared/lib/catalog-role";
import { cn } from "@/shared/lib/utils";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { useSession } from "@/shared/providers/session-provider";
import { Button } from "@/shared/ui/button";
import { confirm } from "@/shared/ui/confirmation";
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
  const { name, config } = useCatalog();
  const about = config?.about;
  const logoMedia = config?.logoMedia;
  const description = config?.description;
  const { isAuthenticated, isLoading, user } = useSession();
  const isGlobalAdmin = isGlobalAdminRole(user?.role);

  const logoutMutation = useAuthControllerLogout();

  const handleCopyCatalogLink = async () => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.host);
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

  return (
    <header className={cn(className)}>
      <div className="space-y-6">
        <div className="-mt-5 flex items-start gap-5">
          <div className="relative">
            <div className="size-27.5 relative overflow-hidden rounded-full border-[0.5px] border-white bg-white shadow-[0_0_6px_0] shadow-black/50 sm:size-35">
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
                "text-[18px] leading-tight font-bold text-black sm:text-2xl",
                isAuthenticated && "flex justify-between",
              )}
            >
              {name}
              {isAuthenticated ? (
                <div className="flex">
                  <button
                    onClick={handleLogout}
                    className="text-primary flex items-center h-fit gap-1 text-xs underline"
                  >
                    Выйти <ArrowRight className="size-3" />
                  </button>
                </div>
              ) : null}
            </h1>
            <h2 className="text-[12px] leading-tight whitespace-pre-line text-black sm:text-base">
              {about || (
                <span className="text-muted">Расскажи, чем занимаешься</span>
              )}
            </h2>
            <p className="text-[10px] whitespace-pre-line sm:text-sm">
              {description || (
                <span className="text-muted">
                  Опиши услуги или товары подробнее. <br />
                  Укажи свои сильные стороны и добавь график работы.
                </span>
              )}
            </p>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : isAuthenticated ? (
          <div className="grid grid-cols-2 gap-y-4 gap-x-2.5">
            <LazyCreateProductDrawerTrigger
              supportsBrands={supportsBrands}
              supportsCategoryDetails={supportsCategoryDetails}
            />
            <Button onClick={handleCopyCatalogLink} variant="outline" size="sm">
              {shareButtonLabel}
            </Button>
            <Button size="sm" variant="outline">
              Статистика аккаунта
            </Button>
            {isGlobalAdmin ? (
              <LazyGlobalAdminDrawerTrigger className="col-span-2" />
            ) : null}
          </div>
        ) : (
          <LazyShareDrawerTrigger />
        )}
      </div>
    </header>
  );
};
