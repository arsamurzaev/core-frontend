"use client";

import { useConfirmationDrawer } from "@/shared/hooks/use-confirmation-drawer";
import { cn } from "@/shared/lib/utils";
import { type ButtonProps } from "@/shared/ui/button";
import { ConfirmationDrawerActions } from "@/shared/ui/confirmation-drawer-actions";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerScrollArea,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
import * as React from "react";
import type {
  DialogProps,
  WithFadeFromProps,
  WithoutFadeFromProps,
} from "vaul";

const DEFAULT_TITLE = "Вы уверены?";
const DEFAULT_CONFIRM_TEXT = "Да";
const DEFAULT_CANCEL_TEXT = "Нет";

type AsyncVoid = void | Promise<void>;

type ConfirmationTone = "default" | "destructive";

type DrawerCommonProps = Omit<
  DialogProps,
  "open" | "defaultOpen" | "onOpenChange" | "snapPoints" | "fadeFromIndex"
>;

type DrawerRootProps =
  | (DrawerCommonProps & WithFadeFromProps)
  | (DrawerCommonProps & WithoutFadeFromProps);

type ButtonOverrides = Omit<ButtonProps, "onClick" | "children" | "disabled">;

export interface ConfirmationDrawerProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  drawerProps?: DrawerRootProps;
  trigger?: React.ReactNode;

  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;

  confirmText?: React.ReactNode;
  cancelText?: React.ReactNode;
  pendingText?: React.ReactNode;

  onConfirm?: () => AsyncVoid;
  onCancel?: () => AsyncVoid;
  onError?: (error: unknown) => void;

  tone?: ConfirmationTone;
  confirmVariant?: ButtonProps["variant"];
  cancelVariant?: ButtonProps["variant"];
  confirmSize?: ButtonProps["size"];
  cancelSize?: ButtonProps["size"];
  confirmButtonProps?: ButtonOverrides;
  cancelButtonProps?: ButtonOverrides;

  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  hideConfirm?: boolean;
  hideCancel?: boolean;

  closeOnConfirm?: boolean;
  closeOnCancel?: boolean;
  preventCloseWhilePending?: boolean;
  onAfterClose?: () => void;

  contentClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

export function ConfirmationDrawer({
  open,
  defaultOpen,
  onOpenChange,
  drawerProps,
  trigger,
  title = DEFAULT_TITLE,
  description,
  icon,
  children,
  footer,
  confirmText = DEFAULT_CONFIRM_TEXT,
  cancelText = DEFAULT_CANCEL_TEXT,
  pendingText,
  onConfirm,
  onCancel,
  onError,
  tone = "default",
  confirmVariant,
  cancelVariant = "secondary",
  confirmSize = "full",
  cancelSize = "full",
  confirmButtonProps,
  cancelButtonProps,
  confirmDisabled,
  cancelDisabled,
  hideConfirm,
  hideCancel,
  closeOnConfirm = true,
  closeOnCancel = true,
  preventCloseWhilePending = true,
  onAfterClose,
  contentClassName,
  headerClassName,
  titleClassName,
  descriptionClassName,
  bodyClassName,
  footerClassName,
}: ConfirmationDrawerProps) {
  const computedConfirmVariant =
    confirmVariant ?? (tone === "destructive" ? "destructive" : "default");
  const {
    actualOpen,
    handleCancel,
    handleCloseAnimationEnd,
    handleConfirm,
    handleOpenChange,
    isPending,
  } = useConfirmationDrawer({
    closeOnCancel,
    closeOnConfirm,
    defaultOpen,
    onAfterClose,
    onCancel,
    onConfirm,
    onError,
    onOpenChange,
    open,
    preventCloseWhilePending,
  });

  return (
    <Drawer open={actualOpen} onOpenChange={handleOpenChange} {...drawerProps}>
      {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
      <DrawerContent
        onAnimationEnd={handleCloseAnimationEnd}
        onTransitionEnd={handleCloseAnimationEnd}
        className={cn("mx-auto w-full max-w-md shadow-xl", contentClassName)}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader className={cn("space-y-2", headerClassName)}>
            <div className="flex items-center gap-3">
              {icon ? <div className="shrink-0">{icon}</div> : null}
              <DrawerTitle
                className={cn("text-lg text-center flex-1", titleClassName)}
              >
                {title}
              </DrawerTitle>
            </div>
            {description ? (
              <DrawerDescription className={cn(descriptionClassName)}>
                {description}
              </DrawerDescription>
            ) : null}
          </DrawerHeader>

          {children ? (
            <DrawerScrollArea className={cn("px-4 pb-2", bodyClassName)}>
              {children}
            </DrawerScrollArea>
          ) : null}

          <ConfirmationDrawerActions
            cancelButtonProps={cancelButtonProps}
            cancelDisabled={cancelDisabled}
            cancelSize={cancelSize}
            cancelText={cancelText}
            cancelVariant={cancelVariant}
            className={footerClassName}
            confirmButtonProps={confirmButtonProps}
            confirmDisabled={confirmDisabled}
            confirmSize={confirmSize}
            confirmText={confirmText}
            confirmVariant={computedConfirmVariant}
            footer={footer}
            hideCancel={hideCancel}
            hideConfirm={hideConfirm}
            isPending={isPending}
            onCancel={handleCancel}
            onConfirm={handleConfirm}
            pendingText={pendingText}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
