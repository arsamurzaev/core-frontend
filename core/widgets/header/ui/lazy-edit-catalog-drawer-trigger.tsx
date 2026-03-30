"use client";

import { Button } from "@/shared/ui/button";
import dynamic from "next/dynamic";
import { Pencil } from "lucide-react";
import React from "react";

const EditCatalogDrawerDynamic = dynamic(
  () =>
    import("@/core/widgets/edit-catalog-drawer/ui/edit-catalog-drawer").then(
      (module) => module.EditCatalogDrawer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

interface LazyEditCatalogDrawerTriggerProps {
  className?: string;
}

export const LazyEditCatalogDrawerTrigger: React.FC<
  LazyEditCatalogDrawerTriggerProps
> = ({ className }) => {
  const [isMounted, setIsMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const handleClick = React.useCallback(() => {
    setIsMounted(true);
    setOpen(true);
  }, []);

  return (
    <>
      <Button
        size="icon"
        onClick={handleClick}
        className={
          className ??
          "shadow-custom absolute right-0 bottom-0 h-[30px] w-[30px] rounded-full border-0 bg-white hover:bg-white"
        }
      >
        <Pencil className="fill-muted-foreground size-4" />
      </Button>
      {isMounted ? (
        <EditCatalogDrawerDynamic
          open={open}
          onOpenChange={setOpen}
          trigger={null}
        />
      ) : null}
    </>
  );
};
