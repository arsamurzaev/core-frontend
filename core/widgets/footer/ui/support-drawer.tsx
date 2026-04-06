"use client";

import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import {
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const PLATFORM_URL = "https://catalog.kreati.ru";

const SUPPORT_LINKS = [
  {
    id: "whatsapp",
    title: "Напишите нам в Whatsapp",
    href: "https://wa.me/+79380018778",
    imageSrc: "/ui-share-wa-icon.svg",
  },
  {
    id: "telegram",
    title: "Напишите нам в Telegram",
    href: "https://t.me/next_time_ts",
    imageSrc: "/ui-share-tg-icon.svg",
  },
] as const;

const LegacyKreatiWordmark: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="52"
      height="13"
      viewBox="0 0 52 13"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0 12.9472V8.77236H1.68934V7.00203H0V0H1.68934V7.00203L5.56954 3.48781H7.73401L3.00914 7.76829L8.84264 12.9472H6.38782L1.68934 8.77236V12.9472H0Z"
        fill="#242426"
      />
      <path
        d="M11.5614 12.9472H9.87208V3.61992H11.5614V5.31098C11.6881 3.81016 13.0132 3.61992 13.198 3.61992H15.0985V5.31098H16.867V6.92276H15.0985V5.31098H11.5614V12.9472Z"
        fill="#242426"
      />
      <path d="M52 0.0528455H50.1259V1.79675H52V0.0528455Z" fill="#242426" />
      <path d="M52 3.67276H50.1259V13H52V3.67276Z" fill="#242426" />
      <path
        d="M42.4183 0.713415H44.1076V3.64634H47.1959V5.25813H44.1076V11.1768H47.1959V12.9736H44.1076V11.1768H42.4183V5.25813H40.1482V3.54065H42.4183V0.713415Z"
        fill="#242426"
      />
      <path
        d="M36.0041 5.36382H30.4081V3.5935H36.0041V5.36382H37.7726V12.9736H36.0041V11.3536C35.9782 11.9614 35.5746 12.9736 34.0772 12.9736H31.8599C31.8599 12.9736 29.8274 12.9736 29.8274 11.2297H36.0041V8.93089H31.6487V7.16057H36.0041V5.36382Z"
        fill="#242426"
      />
      <path d="M29.8274 11.2561V8.93089H31.5695V11.2561H29.8274Z" fill="#242426" />
      <path
        d="M20.7736 12.9207V11.2033H19.0315V7.47764V5.25813C19.0315 4.13781 20.1929 3.68157 20.7736 3.5935C21.7942 3.58469 24.1206 3.57236 25.2609 3.5935C26.4012 3.61463 26.8623 4.71206 26.9503 5.25813V7.31911H25.2609V5.25813H20.7736V7.47764H26.9503V9.11585H20.7736V11.2033H26.9503V12.9207H20.7736Z"
        fill="#242426"
      />
      <path d="M26.9503 7.47764V7.31911H25.2609V7.47764H26.9503Z" fill="#242426" />
    </svg>
  );
};

const LegacyDrawerBrand: React.FC = () => {
  return (
    <p className="text-muted-foreground flex flex-col items-center text-center text-sm">
      Разработано на платформе <br />
      <Link href={PLATFORM_URL} target="_blank" rel="noreferrer">
        <LegacyKreatiWordmark />
      </Link>
    </p>
  );
};

const LegacySupportTriggerIcon: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20.0665 7.7774H19.1041C19.2791 8.39304 19.379 9.04005 19.379 9.71099C19.379 13.6204 16.1985 16.8009 12.2891 16.8009C9.8915 16.8009 7.77207 15.6016 6.48828 13.7746V17.4884C6.48828 18.5546 7.35564 19.422 8.42187 19.422H15.8894L18.2787 21.8113C18.6828 22.2154 19.3789 21.9317 19.3789 21.3556V19.422H20.0664C21.1326 19.422 22 18.5546 22 17.4884V9.71104C22.0001 8.64481 21.1327 7.7774 20.0665 7.7774Z"
        fill="#2167C7"
      />
      <path
        d="M13.5782 0H1.93359C0.86736 0 0 0.86736 0 1.93359V9.71095C0 10.7772 0.86736 11.6445 1.93359 11.6445H2.62107V13.5781C2.62107 14.1471 3.31131 14.4424 3.72129 14.0338L5.63112 12.124C5.35666 11.3694 5.19918 10.5591 5.19918 9.71095C5.19918 5.80158 8.37968 2.62107 12.2891 2.62107C13.4499 2.62107 14.5435 2.90708 15.5117 3.40374V1.93359C15.5118 0.86736 14.6444 0 13.5782 0Z"
        fill="#2167C7"
      />
      <path
        d="M12.2891 3.91022C9.09036 3.91022 6.48828 6.5123 6.48828 9.71102C6.48828 12.9097 9.09036 15.5118 12.2891 15.5118C15.4878 15.5118 18.0899 12.9097 18.0899 9.71102C18.0899 6.5123 15.4878 3.91022 12.2891 3.91022ZM14.1547 9.99927L12.8657 12.5774C12.7073 12.8933 12.3225 13.0255 12.0008 12.8657C11.6823 12.7065 11.5533 12.3193 11.7126 12.0009L12.5352 10.3555H11C10.5228 10.3555 10.2086 9.85102 10.4235 9.42273L11.7126 6.84459C11.8724 6.52545 12.2583 6.39894 12.5774 6.5563C12.8959 6.71555 13.0249 7.10267 12.8657 7.42112L12.043 9.06647H13.5782C14.0554 9.06647 14.3696 9.57098 14.1547 9.99927Z"
        fill="#2167C7"
      />
    </svg>
  );
};

const LegacyDrawerHeader: React.FC = () => {
  return (
    <DrawerHeader className="gap-y-5 pb-1 [&_svg]:size-5 [&_svg]:text-muted-foreground">
      <DrawerTitle className="flex items-center justify-between" asChild>
        <div>
          <h2 className="flex-1 text-center text-2xl font-bold">
            Выберите удобный сервис для связи с нами
          </h2>
          <DrawerClose className="text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M8.83793 7.5L14.9019 1.43638C15.0325 1.3057 15.0325 1.09396 14.9019 0.963277L14.0371 0.097971C13.9744 0.035396 13.889 0 13.8004 0C13.7116 0 13.6264 0.035396 13.5637 0.097971L7.49982 6.16175L1.43597 0.097971C1.31034 -0.0276531 1.08801 -0.0274951 0.962697 0.097971L0.0980118 0.963277C-0.0326706 1.09396 -0.0326706 1.3057 0.0980118 1.43638L6.16187 7.5L0.0980118 13.5636C-0.0326706 13.6943 -0.0326706 13.906 0.0980118 14.0367L0.962855 14.902C1.02559 14.9646 1.11076 15 1.19957 15C1.28838 15 1.37339 14.9646 1.43612 14.902L7.49998 8.83825L13.5638 14.902C13.6266 14.9646 13.7119 15 13.8005 15C13.8892 15 13.9745 14.9646 14.0373 14.902L14.9021 14.0367C15.0326 13.906 15.0326 13.6943 14.9021 13.5636L8.83793 7.5Z"
                fill="#D2D2D2"
              />
            </svg>
            <span className="sr-only">Закрыть</span>
          </DrawerClose>
        </div>
      </DrawerTitle>
      <DrawerDescription className="sr-only">
        Выберите удобный сервис для связи с нами
      </DrawerDescription>
    </DrawerHeader>
  );
};

interface SupportDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SupportDrawer: React.FC<SupportDrawerProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      trigger={
        <button type="button" className="flex items-center gap-2">
          <LegacySupportTriggerIcon />
          Техническая поддержка
        </button>
      }
    >
      <AppDrawer.Content className="h-fit max-h-[40%] pb-10 text-center">
        <LegacyDrawerHeader />
        <div className="space-y-8">
          <div className="flex justify-evenly">
            {SUPPORT_LINKS.map((item) => (
              <div key={item.id} className="basis-1/4">
                <Button asChild variant="ghost" className="size-[60px]" size="icon">
                  <Link
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.title}
                  >
                    <Image
                      src={item.imageSrc}
                      width={60}
                      height={60}
                      className="h-full w-full object-cover"
                      alt=""
                    />
                  </Link>
                </Button>
                <p className="text-xs">{item.title}</p>
              </div>
            ))}
          </div>
          <LegacyDrawerBrand />
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
