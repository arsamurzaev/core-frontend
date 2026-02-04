"use client";

import { useAuthControllerLogout } from "@/shared/api/generated";
import { cn } from "@/shared/lib/utils";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { useSession } from "@/shared/providers/session-provider";
import { AspectRatio } from "@/shared/ui/aspect-ratio";
import { Button } from "@/shared/ui/button";
import { confirm } from "@/shared/ui/confirmation";
import { Skeleton } from "@/shared/ui/skeleton";

import React, { PropsWithChildren } from "react";
import { toast } from "sonner";

interface Props {
  className?: string;
}

export const Header: React.FC<PropsWithChildren<Props>> = ({ className }) => {
  const { catalog } = useCatalog();

  const { isLoading, isAuthenticated, refetch } = useSession();

  const logoutMutation = useAuthControllerLogout({
    mutation: {
      onSuccess: () => {
        refetch();
      },
    },
  });

  const handleLogout = async () => {
    await confirm({
      title: "Выйти из административной панели?",
      description: null,
      confirmText: "Да",
      cancelText: "Нет",
      onConfirm: async () => {
        toast.promise(logoutMutation.mutateAsync(), {
          loading: "Выход из аккаунта...",
          success: "Вы успешно вышли из аккаунта",
          error: (err) => `Ошибка при выходе из аккаунта: ${err.message}`,
        });
      },
    });
  };

  if (!catalog) {
    return null;
  }

  const {
    name,
    config: { about, description, logoUrl },
  } = catalog;

  return (
    <header className={cn("-mt-7 space-y-6", className)}>
      <div className="flex gap-5">
        <div className="size-27.5 md:size-35">
          <AspectRatio ratio={1 / 1}>
            <img
              src={logoUrl || "/default-avatar.png"}
              className="size-full rounded-full overflow-hidden border-[0.5px] border-white bg-white shadow-[0_0_6px_0] shadow-black/50"
            />
          </AspectRatio>
        </div>
        <div className="pt-8">
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
        <div className="pt-8">
          <Button onClick={handleLogout}>Выйти</Button>
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-10 rounded-md" />
      ) : isAuthenticated ? (
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-4">
          <Button className="col-span-2" size={"lg"}>
            + Добавить позицию
          </Button>
          <Button variant={"outline"} size={"sm"}>
            Поделиться каталогом
          </Button>
          <Button variant={"outline"} size={"sm"}>
            Статистика аккаунта
          </Button>
        </div>
      ) : (
        <Button className="w-full font-semibold" variant={"outline"}>
          Связаться с нами
        </Button>
      )}
    </header>
  );
};
