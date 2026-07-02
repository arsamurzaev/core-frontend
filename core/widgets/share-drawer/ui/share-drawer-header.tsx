"use client";

import {
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { X } from "lucide-react";

interface ShareDrawerHeaderProps {
  title: string;
}

export function ShareDrawerHeader({ title }: ShareDrawerHeaderProps) {
  return (
    <DrawerHeader className="[&_svg]:text-text-muted gap-y-5 pb-1 [&_svg]:size-5">
      <DrawerTitle className="flex items-center justify-between" asChild>
        <div>
          <h2 className="flex-1 text-center text-2xl font-bold">{title}</h2>
          <DrawerClose className="text-text-muted">
            <X />
            <span className="sr-only">Закрыть</span>
          </DrawerClose>
        </div>
      </DrawerTitle>
      <DrawerDescription />
    </DrawerHeader>
  );
}
