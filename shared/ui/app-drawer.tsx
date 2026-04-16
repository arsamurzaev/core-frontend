"use client";

import { cn } from "@/shared/lib/utils";
import {
  AppDrawerFooter,
  type AppDrawerFooterProps,
} from "@/shared/ui/app-drawer-footer";
import {
  AppDrawerHeader,
  type AppDrawerHeaderProps,
} from "@/shared/ui/app-drawer-header";
import { Drawer, DrawerContent, DrawerTrigger } from "@/shared/ui/drawer";
import * as React from "react";

type AppDrawerProps = React.PropsWithChildren<
  React.ComponentProps<typeof Drawer> & {
    className?: string;
    trigger?: React.ReactNode;
  }
>;

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

const AppDrawerContent: React.FC<
  React.ComponentProps<typeof DrawerContent>
> = ({ className, children, ...props }) => {
  return (
    <DrawerContent className={cn("mx-auto w-full max-w-180", className)} {...props}>
      {children}
    </DrawerContent>
  );
};

export const AppDrawer = AppDrawerRoot as AppDrawerComponent;

AppDrawer.Content = AppDrawerContent;
AppDrawer.Header = AppDrawerHeader;
AppDrawer.Footer = AppDrawerFooter;
