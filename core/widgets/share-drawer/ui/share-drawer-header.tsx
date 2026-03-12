"use client";

import {
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";

interface ShareDrawerHeaderProps {
  title: string;
}

export function ShareDrawerHeader({ title }: ShareDrawerHeaderProps) {
  return (
    <DrawerHeader className="[&_svg]:text-muted-foreground gap-y-5 pb-1 [&_svg]:size-5">
      <DrawerTitle className="flex items-center justify-between" asChild>
        <div>
          <h2 className="flex-1 text-center text-2xl font-bold">{title}</h2>
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
      <DrawerDescription />
    </DrawerHeader>
  );
}
