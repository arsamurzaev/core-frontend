"use client";

import { cn } from "@/shared/lib/utils";
import { Button, type ButtonProps } from "@/shared/ui/button";
import { DrawerClose, DrawerFooter } from "@/shared/ui/drawer";
import { Loader2 } from "lucide-react";
import * as React from "react";

export type AppDrawerFooterProps = React.PropsWithChildren<{
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

const DEFAULT_APP_DRAWER_BUTTON_TEXT = "Сохранить изменения";

export const AppDrawerFooter: React.FC<AppDrawerFooterProps> = ({
  className,
  loading = false,
  isFooterBtnDisabled = false,
  footerBtnRef,
  isAutoClose = true,
  hasFooterBtn = true,
  btnText = DEFAULT_APP_DRAWER_BUTTON_TEXT,
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
