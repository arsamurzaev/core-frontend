"use client";

import { cn } from "@/shared/lib/utils";
import { Button, type ButtonProps } from "@/shared/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerScrollArea,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
import { Loader2 } from "lucide-react";
import * as React from "react";
import type { DialogProps, WithFadeFromProps, WithoutFadeFromProps } from "vaul";

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
  cancelVariant = "outline",
  confirmSize = "default",
  cancelSize = "default",
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
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false);
  const [isPending, setIsPending] = React.useState(false);
  const isMountedRef = React.useRef(true);
  const afterCloseFiredRef = React.useRef(false);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const actualOpen = isControlled ? open : internalOpen;
  React.useEffect(() => {
    if (actualOpen) afterCloseFiredRef.current = false;
  }, [actualOpen]);

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next && preventCloseWhilePending && isPending) return;
      setOpen(next);
    },
    [isPending, preventCloseWhilePending, setOpen],
  );

  const closeDrawer = React.useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const handleCancel = React.useCallback(async () => {
    if (preventCloseWhilePending && isPending) return;
    try {
      await onCancel?.();
      if (closeOnCancel) closeDrawer();
    } catch (error) {
      onError?.(error);
    }
  }, [
    preventCloseWhilePending,
    isPending,
    onCancel,
    closeOnCancel,
    closeDrawer,
    onError,
  ]);

  const handleConfirm = React.useCallback(async () => {
    if (isPending) return;
    if (!onConfirm) {
      if (closeOnConfirm) closeDrawer();
      return;
    }

    setIsPending(true);
    try {
      await onConfirm();
      if (closeOnConfirm) closeDrawer();
    } catch (error) {
      onError?.(error);
    } finally {
      if (isMountedRef.current) setIsPending(false);
    }
  }, [isPending, onConfirm, closeOnConfirm, closeDrawer, onError]);

  const computedConfirmVariant =
    confirmVariant ?? (tone === "destructive" ? "destructive" : "default");

  const handleCloseAnimationEnd = React.useCallback(
    (
      event:
        | React.AnimationEvent<HTMLDivElement>
        | React.TransitionEvent<HTMLDivElement>,
    ) => {
      if (event.target !== event.currentTarget) return;
      if (actualOpen) return;
      const state = event.currentTarget.getAttribute("data-state");
      if (state && state !== "closed") return;
      if (afterCloseFiredRef.current) return;
      afterCloseFiredRef.current = true;
      onAfterClose?.();
    },
    [actualOpen, onAfterClose],
  );

  return (
    <Drawer open={actualOpen} onOpenChange={handleOpenChange} {...drawerProps}>
      {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
      <DrawerContent
        onAnimationEnd={handleCloseAnimationEnd}
        onTransitionEnd={handleCloseAnimationEnd}
        className={cn(
          "mx-auto w-full max-w-md rounded-2xl shadow-xl",
          contentClassName,
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader className={cn("space-y-2", headerClassName)}>
            <div className="flex items-center gap-3">
              {icon ? <div className="shrink-0">{icon}</div> : null}
              <DrawerTitle className={cn("text-lg", titleClassName)}>
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

          <DrawerFooter
            className={cn(
              "flex-col gap-2 sm:flex-row sm:justify-end",
              footerClassName,
            )}
          >
            {footer ? (
              footer
            ) : (
              <>
                {!hideCancel ? (
                  <Button
                    type="button"
                    variant={cancelVariant}
                    size={cancelSize}
                    onClick={handleCancel}
                    disabled={cancelDisabled || isPending}
                    {...cancelButtonProps}
                  >
                    {cancelText}
                  </Button>
                ) : null}
                {!hideConfirm ? (
                  <Button
                    type="button"
                    variant={computedConfirmVariant}
                    size={confirmSize}
                    onClick={handleConfirm}
                    disabled={confirmDisabled || isPending}
                    {...confirmButtonProps}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {pendingText ?? confirmText}
                      </>
                    ) : (
                      confirmText
                    )}
                  </Button>
                ) : null}
              </>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
