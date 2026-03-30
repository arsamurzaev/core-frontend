"use client";

import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import dynamic from "next/dynamic";
import React from "react";

const CreateProductDrawerDynamic = dynamic(
  () =>
    import("@/core/widgets/create-product-drawer/ui/create-product-drawer").then(
      (module) => module.CreateProductDrawer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

interface LazyCreateProductDrawerTriggerProps {
  className?: string;
}

export const LazyCreateProductDrawerTrigger: React.FC<
  LazyCreateProductDrawerTriggerProps
> = ({ className }) => {
  const [isMounted, setIsMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const handleClick = React.useCallback(() => {
    setIsMounted(true);
    setOpen(true);
  }, []);

  return (
    <>
      <Button className={cn("col-span-2", className)} onClick={handleClick}>
        + Добавить позицию
      </Button>
      {isMounted ? (
        <CreateProductDrawerDynamic
          open={open}
          onOpenChange={setOpen}
          trigger={null}
        />
      ) : null}
    </>
  );
};
