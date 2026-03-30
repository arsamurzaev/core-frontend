"use client";

import type { ShareDrawerProps } from "@/core/widgets/share-drawer/model/share-drawer-types";
import { Button } from "@/shared/ui/button";
import dynamic from "next/dynamic";
import React from "react";

const ShareDrawerDynamic = dynamic(
  () =>
    import("@/core/widgets/share-drawer/ui/share-drawer").then(
      (module) => module.ShareDrawer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

type LazyShareDrawerTriggerProps = Omit<
  ShareDrawerProps,
  "open" | "onOpenChange" | "trigger"
> & {
  trigger?: React.ReactNode;
};

export const LazyShareDrawerTrigger: React.FC<LazyShareDrawerTriggerProps> = ({
  trigger,
  ...props
}) => {
  const [isMounted, setIsMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const handleClick = React.useCallback(() => {
    setIsMounted(true);
    setOpen(true);
  }, []);

  const resolvedTrigger =
    trigger ?? (
      <Button
        className="w-full font-semibold"
        variant="outline"
        onClick={handleClick}
      >
        Связаться с нами
      </Button>
    );

  const resolvedCustomTrigger = React.useMemo(() => {
    if (!trigger || !React.isValidElement(trigger)) {
      return null;
    }

    const triggerElement = trigger as React.ReactElement<{
      onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    }>;

    return React.cloneElement(triggerElement, {
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        if (typeof triggerElement.props.onClick === "function") {
          triggerElement.props.onClick(event);
        }

        if (!event.defaultPrevented) {
          handleClick();
        }
      },
    });
  }, [handleClick, trigger]);

  return (
    <>
      {resolvedCustomTrigger ?? resolvedTrigger}
      {isMounted ? (
        <ShareDrawerDynamic
          {...props}
          open={open}
          onOpenChange={setOpen}
          trigger={null}
        />
      ) : null}
    </>
  );
};
