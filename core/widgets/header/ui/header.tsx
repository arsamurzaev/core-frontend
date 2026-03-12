"use client";

/* eslint-disable @next/next/no-img-element */
import { CreateProductDrawer } from "@/core/widgets/create-product-drawer/ui/create-product-drawer";
import { EditCatalogDrawer } from "@/core/widgets/edit-catalog-drawer/ui/edit-catalog-drawer";
import { ShareDrawer } from "@/core/widgets/share-drawer/ui/share-drawer";
import { useAuthControllerLogout } from "@/shared/api/generated";
import { cn } from "@/shared/lib/utils";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { useSession } from "@/shared/providers/session-provider";
import { Button } from "@/shared/ui/button";
import { confirm } from "@/shared/ui/confirmation";
import { Skeleton } from "@/shared/ui/skeleton";
import { ArrowRight, Pencil } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface Props {
  className?: string;
}

export const Header: React.FC<Props> = ({ className }) => {
  const { name, config } = useCatalog();
  const about = config?.about;
  const logoMedia = config?.logoMedia;
  const description = config?.description;
  const { isAuthenticated, isLoading } = useSession();

  const logoutMutation = useAuthControllerLogout();

  const handleCopyCatalogLink = async () => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.host);
      toast.success("Ссылка скопирована в буфер обмена");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Не удалось скопировать ссылку",
      );
    }
  };

  const handleLogout = async () => {
    const getConfirm = await confirm({
      title: "Выход",
      description: "Вы действительно хотите выйти?",
    });

    if (!getConfirm) {
      return;
    }

    toast.promise(logoutMutation.mutateAsync(), {
      loading: "Выход...",
      success: () => "Выход выполнен",
      error: (err) => (err instanceof Error ? err.message : "Ошибка выхода"),
    });
  };

  return (
    <header className={cn("", className)}>
      <div className="space-y-6">
        <div className="-mt-5 flex items-start gap-5">
          <div className="relative">
            <div className="size-27.5 rounded-full border-[0.5px] border-white bg-white shadow-[0_0_6px_0] shadow-black/50 sm:size-35">
              <img
                alt=""
                src={logoMedia?.url || "/default-avatar.png"}
                className="h-full w-full rounded-full object-contain"
              />
            </div>
            {isAuthenticated ? (
              <EditCatalogDrawer
                trigger={
                  <Button
                    size="icon"
                    className="shadow-custom absolute right-0 bottom-0 h-[30px] w-[30px] rounded-full border-0 bg-white hover:bg-white"
                  >
                    <Pencil className="fill-muted-foreground size-4" />
                  </Button>
                }
              />
            ) : null}
          </div>
          <div className="pt-6 flex-1">
            <h1 className="text-[18px] leading-tight font-bold text-black sm:text-2xl">
              {name}
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
          {isAuthenticated && (
            <div className="flex pt-6">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-primary h-fit gap-1 text-xs underline"
              >
                Выйти <ArrowRight className="size-3" />
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="w-full h-10" />
        ) : isAuthenticated ? (
          <div className="grid grid-cols-2 gap-y-4 gap-x-2.5">
            <CreateProductDrawer />
            <Button onClick={handleCopyCatalogLink} variant="outline" size="sm">
              Поделиться каталогом
            </Button>
            <Button size={"sm"} variant={"outline"}>
              Статистика аккаунта
            </Button>
          </div>
        ) : (
          <ShareDrawer />
        )}
      </div>
    </header>
  );
};
