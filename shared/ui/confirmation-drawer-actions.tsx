"use client";

import { cn } from "@/shared/lib/utils";
import { Button, type ButtonProps } from "@/shared/ui/button";
import { DrawerFooter } from "@/shared/ui/drawer";
import { Loader2 } from "lucide-react";
import React from "react";

type ButtonOverrides = Omit<ButtonProps, "onClick" | "children" | "disabled">;

type ConfirmationDrawerActionsProps = {
  cancelButtonProps?: ButtonOverrides;
  cancelDisabled?: boolean;
  cancelSize: ButtonProps["size"];
  cancelText: React.ReactNode;
  cancelVariant: ButtonProps["variant"];
  className?: string;
  confirmButtonProps?: ButtonOverrides;
  confirmDisabled?: boolean;
  confirmSize: ButtonProps["size"];
  confirmText: React.ReactNode;
  confirmVariant: ButtonProps["variant"];
  footer?: React.ReactNode;
  hideCancel?: boolean;
  hideConfirm?: boolean;
  isPending: boolean;
  onCancel: () => void | Promise<void>;
  onConfirm: () => void | Promise<void>;
  pendingText?: React.ReactNode;
};

export const ConfirmationDrawerActions: React.FC<
  ConfirmationDrawerActionsProps
> = ({
  cancelButtonProps,
  cancelDisabled,
  cancelSize,
  cancelText,
  cancelVariant,
  className,
  confirmButtonProps,
  confirmDisabled,
  confirmSize,
  confirmText,
  confirmVariant,
  footer,
  hideCancel,
  hideConfirm,
  isPending,
  onCancel,
  onConfirm,
  pendingText,
}) => {
  return (
    <DrawerFooter
      className={cn(
        "flex-col gap-2 sm:flex-row sm:justify-end",
        className,
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
              onClick={() => void onCancel()}
              disabled={cancelDisabled || isPending}
              {...cancelButtonProps}
            >
              {cancelText}
            </Button>
          ) : null}
          {!hideConfirm ? (
            <Button
              type="button"
              variant={confirmVariant}
              size={confirmSize}
              onClick={() => void onConfirm()}
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
  );
};
