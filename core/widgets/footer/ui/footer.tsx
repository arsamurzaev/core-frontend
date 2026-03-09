"use client";

import { cn } from "@/shared/lib/utils";
import { useSession } from "@/shared/providers/session-provider";
import { Button } from "@/shared/ui/button";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { KreatiLogo } from "@/shared/ui/icons/kreati-logo";
import { LifeBuoy, MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import React from "react";

interface Props {
  className?: string;
}

const PLATFORM_URL = "https://catalog.kreati.ru";

const SUPPORT_LINKS = [
  {
    id: "whatsapp",
    title: "Напишите нам в WhatsApp",
    href: "https://wa.me/+79380018778",
    icon: MessageCircle,
  },
  {
    id: "telegram",
    title: "Напишите нам в Telegram",
    href: "https://t.me/next_time_ts",
    icon: Send,
  },
] as const;

const FooterBrand: React.FC = () => {
  return (
    <h3 className="text-muted-foreground flex flex-col items-center justify-center gap-1 text-center text-sm">
      <span>Разработано на платформе</span>
      <Link
        href={PLATFORM_URL}
        target="_blank"
        rel="noreferrer"
        className="text-foreground inline-flex items-center gap-2"
      >
        <KreatiLogo className="h-8 w-auto" />
        <span className="text-base font-medium">Kreati</span>
      </Link>
    </h3>
  );
};

const SupportDrawer: React.FC = () => {
  return (
    <AppDrawer
      trigger={
        <button
          type="button"
          className="text-foreground inline-flex items-center gap-2 text-sm"
        >
          <LifeBuoy className="size-5 text-[#2167C7]" />
          Техническая поддержка
        </button>
      }
    >
      <AppDrawer.Content className="mx-auto w-full max-w-md">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Выберите удобный сервис для связи с нами"
            description=""
          />
          <div className="space-y-8 px-5 pb-10">
            <div className="flex justify-evenly">
              {SUPPORT_LINKS.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.id} className="basis-1/3 text-center">
                    <Link href={item.href} target="_blank" rel="noreferrer">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-[60px] rounded-full"
                      >
                        <span className="bg-secondary inline-flex size-[52px] items-center justify-center rounded-full">
                          <Icon className="size-6 text-[#2167C7]" />
                        </span>
                      </Button>
                    </Link>
                    <p className="mt-2 text-xs">{item.title}</p>
                  </div>
                );
              })}
            </div>
            <FooterBrand />
          </div>
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};

export const Footer: React.FC<Props> = ({ className }) => {
  const { user } = useSession();
  const canOpenSupport =
    user?.role === "CATALOG" || user?.role === "ADMIN";

  return (
    <footer className={cn("space-y-6 pb-28", className)}>
      <FooterBrand />
      {canOpenSupport ? (
        <div className="flex justify-center">
          <SupportDrawer />
        </div>
      ) : null}
    </footer>
  );
};
