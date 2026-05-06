"use client";

import { SUBSCRIPTION_PLANS } from "@/core/widgets/footer/model/subscription-plans";
import type { SubscriptionPlan } from "@/core/widgets/footer/model/subscription-plans";
import { useDrawerCoordinator } from "@/shared/providers/drawer-coordinator-provider";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/shared/ui/carousel";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { X } from "lucide-react";
import React from "react";

const SubscriptionPlanCard: React.FC<{ plan: SubscriptionPlan }> = ({ plan }) => {
  return (
    <article className="bg-muted/20 flex h-full flex-col justify-between gap-6 rounded-xl px-9 py-5 text-left select-none">
      <div className="space-y-2">
        <h3 className="flex items-center gap-2 text-[clamp(14px,7cqw,25px)] leading-none font-bold">
          <plan.Icon className={plan.iconClassName} />
          {plan.title}
        </h3>
        <p className="text-[clamp(12px,5cqw,14px)] font-medium whitespace-pre-line">
          {plan.description}
        </p>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-6">
        <ul className="space-y-6">
          {plan.benefits.map((benefit) => (
            <li
              key={benefit}
              className="text-[clamp(10px,5cqw,12px)] flex items-center gap-3 leading-none"
            >
              <Checkbox className="bg-primary" checked />
              {benefit}
            </li>
          ))}
        </ul>
        <div className="space-y-1 text-right">
          <p className="text-[clamp(10px,5.5cqw,16px)] leading-none line-through">
            {plan.oldPrice ?? ""}
          </p>
          <h3 className="text-[clamp(16px,8cqw,24px)] leading-none font-bold">
            {plan.price}
          </h3>
        </div>
      </div>
    </article>
  );
};

interface SubscriptionReminderDrawerProps {
  message: string;
  onOpenChange: (open: boolean) => void;
  onRenewClick: () => void;
  open: boolean;
}

export const SubscriptionReminderDrawer: React.FC<SubscriptionReminderDrawerProps> = ({
  message,
  onOpenChange,
  onRenewClick,
  open,
}) => {
  const { registerBlockingDrawer } = useDrawerCoordinator();

  React.useEffect(() => {
    if (!open) {
      return;
    }

    return registerBlockingDrawer("subscription-warning");
  }, [open, registerBlockingDrawer]);

  return (
    <AppDrawer open={open} onOpenChange={onOpenChange}>
      <AppDrawer.Content className="max-h-fit pb-10">
        <DrawerHeader className="gap-y-5 pb-1">
          <div className="grid grid-cols-[20px_minmax(0,1fr)_20px] items-start gap-2">
            <div />
            <div className="space-y-3 text-center">
              <DrawerTitle className="text-base font-normal">
                До конца вашей подписки осталось
              </DrawerTitle>
              <DrawerDescription className="text-foreground text-6xl font-semibold">
                {message}
              </DrawerDescription>
            </div>
            <div className="flex justify-end">
              <DrawerClose className="text-muted-foreground inline-flex items-center justify-center">
                <X className="size-4" />
                <span className="sr-only">Закрыть</span>
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>

        <div className="space-y-10 overflow-y-auto">
          <p className="px-5.5 text-center text-xs">
            Оставайтесь с нами — всё только начинается.
            <br />
            Ваш «Каталог» продолжает работать, пока вы с нами. Мы сохраним все
            ваши данные, оформление и настройки, чтобы вы просто продолжали
            развивать бизнес без пауз. Спасибо, что выбираете нас.
          </p>

          <div className="px-5">
            <Carousel opts={{ align: "start" }}>
              <CarouselContent>
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <CarouselItem key={plan.id} className="basis-5/6">
                    <SubscriptionPlanCard plan={plan} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          <div className="px-4">
            <Button
              className="rounded-full"
              size="full"
              onClick={onRenewClick}
            >
              Продлить подписку
            </Button>
          </div>
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
