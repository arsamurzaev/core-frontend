"use client";

import { cn } from "@/shared/lib/utils";
import { Button, type ButtonProps } from "@/shared/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
import { Loader2, X } from "lucide-react";
import * as React from "react";

type AppDrawerProps = React.PropsWithChildren<
  React.ComponentProps<typeof Drawer> & {
    className?: string;
    trigger?: React.ReactNode;
  }
>;

type AppDrawerHeaderProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  trailingTitleNode?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  closeButtonClassName?: string;
  withCloseButton?: boolean;
};

type AppDrawerFooterProps = React.PropsWithChildren<{
  className?: string;
  loading?: boolean;
  isFooterBtnDisabled?: boolean;
  footerBtnRef?: React.RefObject<HTMLButtonElement | null>;
  isAutoClose?: boolean;
  hasFooterBtn?: boolean;
  btnText?: React.ReactNode;
  handleClick?: () => void;
  buttonVariant?: ButtonProps["variant"];
  buttonSize?: ButtonProps["size"];
  buttonType?: "button" | "submit";
  buttonClassName?: string;
}>;

type AppDrawerComponent = React.FC<AppDrawerProps> & {
  Content: React.FC<React.ComponentProps<typeof DrawerContent>>;
  Header: React.FC<AppDrawerHeaderProps>;
  Footer: React.FC<AppDrawerFooterProps>;
};

const AppDrawerRoot: React.FC<AppDrawerProps> = ({
  className,
  trigger,
  children,
  ...props
}) => {
  return (
    <Drawer {...props}>
      {trigger ? (
        <DrawerTrigger className={cn(className)} asChild>
          {trigger}
        </DrawerTrigger>
      ) : null}
      {children}
    </Drawer>
  );
};

const AppDrawerContent: React.FC<React.ComponentProps<typeof DrawerContent>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <DrawerContent className={cn(className)} {...props}>
      {children}
    </DrawerContent>
  );
};

const AppDrawerHeader: React.FC<AppDrawerHeaderProps> = ({
  title,
  description = (
    <>
      <span className="text-red-600">*</span> — отмечены обязательные поля к
      заполнению
    </>
  ),
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

const AppDrawerFooter: React.FC<AppDrawerFooterProps> = ({
  className,
  loading = false,
  isFooterBtnDisabled = false,
  footerBtnRef,
  isAutoClose = true,
  hasFooterBtn = true,
  btnText = "Сохранить изменения",
  handleClick,
  buttonVariant = "default",
  buttonSize = "full",
  buttonType = "submit",
  buttonClassName,
  children,
}) => {
  if (children) {
    return <DrawerFooter className={cn(className)}>{children}</DrawerFooter>;
  }

  if (!hasFooterBtn) {
    return <DrawerFooter className={cn(className)} />;
  }

  const button = (
    <Button
      ref={footerBtnRef}
      type={buttonType}
      onClick={handleClick}
      className={cn("rounded-full", buttonClassName)}
      disabled={loading || isFooterBtnDisabled}
      size={buttonSize}
      variant={buttonVariant}
    >
      {btnText}
      {loading ? <Loader2 className="animate-spin" /> : null}
    </Button>
  );

  return (
    <DrawerFooter className={cn(className)}>
      {isAutoClose ? <DrawerClose asChild>{button}</DrawerClose> : button}
    </DrawerFooter>
  );
};

export const AppDrawer = AppDrawerRoot as AppDrawerComponent;

AppDrawer.Content = AppDrawerContent;
AppDrawer.Header = AppDrawerHeader;
AppDrawer.Footer = AppDrawerFooter;

