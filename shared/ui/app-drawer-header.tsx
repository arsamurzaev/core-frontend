"use client";

import { cn } from "@/shared/lib/utils";
import {
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { X } from "lucide-react";
import * as React from "react";

export type AppDrawerHeaderProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  trailingTitleNode?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  closeButtonClassName?: string;
  withCloseButton?: boolean;
};

const DEFAULT_APP_DRAWER_DESCRIPTION = (
  <>
    <span className="text-red-600">*</span> — отмечены обязательные поля к
    заполнению
  </>
);

export const AppDrawerHeader: React.FC<AppDrawerHeaderProps> = ({
  title,
  description = DEFAULT_APP_DRAWER_DESCRIPTION,
  trailingTitleNode,
  className,
  titleClassName,
  closeButtonClassName,
  withCloseButton = true,
}) => {
  return (
    <DrawerHeader className={cn("gap-y-5 pb-1", className)}>
      <div
        className={cn(
          "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2",
          titleClassName,
        )}
      >
        <div className="min-w-0">{trailingTitleNode}</div>
        <DrawerTitle className="text-center text-2xl font-bold">
          {title}
        </DrawerTitle>
        <div className="flex justify-end">
          {withCloseButton ? (
            <DrawerClose
              className={cn(
                "text-muted-foreground inline-flex items-center justify-center",
                closeButtonClassName,
              )}
            >
              <X className="size-4" />
              <span className="sr-only">Закрыть</span>
            </DrawerClose>
          ) : null}
        </div>
      </div>

      {description ? <DrawerDescription>{description}</DrawerDescription> : null}
    </DrawerHeader>
  );
};
