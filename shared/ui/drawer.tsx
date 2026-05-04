"use client";

import { cn } from "@/shared/lib/utils";
import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

/**
 * Root wrappers
 */
function Drawer({
  handleOnly = false,
  repositionInputs = false,
  scrollLockTimeout = 300,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      handleOnly={handleOnly}
      repositionInputs={repositionInputs}
      scrollLockTimeout={scrollLockTimeout}
      {...props}
    />
  );
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        // animations
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        // layout
        "fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Handle: drag only here (the key stability trick)
 */
function DrawerHandle({
  className,
  preventCycle = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Handle>) {
  return (
    <DrawerPrimitive.Handle
      data-slot="drawer-handle"
      className={cn(
        "relative h-8 w-20 rounded-full bg-transparent",
        "after:absolute after:top-1/2 after:left-1/2 after:h-1.5 after:w-12 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-muted after:content-['']",
        className,
      )}
      preventCycle={preventCycle}
      {...props}
    />
  );
}

/**
 * Scroll area: prevent scroll/drag conflicts
 */
function DrawerScrollArea({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-scroll-area"
      className={cn(
        // scrolling
        "min-h-0 flex-1 overflow-auto",
        // iOS smooth scrolling
        "[webkit-overflow-scrolling:touch]",
        // stop rubber-banding from propagating to the page (where supported)
        "[overscroll-behavior:contain]",
        className,
      )}
      {...props}
    />
  );
}

interface DrawerContentProps extends React.ComponentProps<
  typeof DrawerPrimitive.Content
> {
  handleClassName?: string;
  handleWrapperClassName?: string;
  hideHandle?: boolean;
  hideOverlay?: boolean;
  overlayClassName?: string;
}

function DrawerContent({
  className,
  children,
  handleClassName,
  handleWrapperClassName,
  hideHandle = false,
  hideOverlay = false,
  overlayClassName,
  ...props
}: DrawerContentProps) {
  return (
    <DrawerPortal>
      {!hideOverlay ? <DrawerOverlay className={overlayClassName} /> : null}
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "group/drawer-content bg-background fixed z-50 flex flex-col outline-none",
          // iOS height correctness + safe area bottom
          "max-h-[92dvh] pb-[safe-area-inset-bottom]",

          // top
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0",
          "data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",

          // bottom
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0",
          "data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",
          "data-[vaul-drawer-direction=bottom]:max-w-180 data-[vaul-drawer-direction=bottom]:mx-auto",

          // right
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0",
          "data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",

          // left
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0",
          "data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",

          // IMPORTANT: clip rounded corners when inner content scrolls
          "overflow-hidden",

          className,
        )}
        {...props}
      >
        {/* Only show handle for bottom/top by default (optional) */}
        {!hideHandle ? (
          <div
            className={cn(
              "flex justify-center py-3",
              "group-data-[vaul-drawer-direction=left]/drawer-content:hidden group-data-[vaul-drawer-direction=right]/drawer-content:hidden",
              handleWrapperClassName,
            )}
          >
            <DrawerHandle className={handleClassName} />
          </div>
        ) : null}

        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "shrink-0 p-4 pt-0",
        "flex flex-col gap-0.5 md:gap-1.5",
        "group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center",
        "group-data-[vaul-drawer-direction=top]/drawer-content:text-center",
        "md:text-left",
        className,
      )}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn(
        "shrink-0 mt-auto flex flex-col gap-2 px-4 pt-4 pb-3",
        className,
      )}
      {...props}
    />
  );
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerScrollArea,
  DrawerTitle,
  DrawerTrigger
};

