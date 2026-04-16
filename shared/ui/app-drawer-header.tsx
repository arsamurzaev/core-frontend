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
    <DrawerHeader
      className={cn(
        "[&_svg]:text-muted-foreground gap-y-5 [&_svg]:size-6",
        className,
      )}
    >
      <DrawerTitle
        className={cn("flex items-center justify-between", titleClassName)}
        asChild
      >
        <div>
          {trailingTitleNode ? (
            <div className="min-w-0 shrink-0">{trailingTitleNode}</div>
          ) : (
            <div className="size-8 shrink-0" />
          )}
          <h2 className="flex-1 text-center text-2xl font-bold">{title}</h2>
          {withCloseButton ? (
            <DrawerClose
              className={cn(
                "text-muted-foreground inline-flex size-8 shrink-0 items-center justify-center rounded-full",
                closeButtonClassName,
              )}
            >
              <X />
              <span className="sr-only">Закрыть</span>
            </DrawerClose>
          ) : (
            <div className="size-8 shrink-0" />
          )}
        </div>
      </DrawerTitle>

      {description ? (
        <DrawerDescription>{description}</DrawerDescription>
      ) : null}
    </DrawerHeader>
  );
};
