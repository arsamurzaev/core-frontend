"use client";

import { Button } from "@/shared/ui/button";
import dynamic from "next/dynamic";
import { ShieldAlert } from "lucide-react";
import React from "react";

const GlobalAdminDrawerDynamic = dynamic(
  () =>
    import("@/core/widgets/global-admin-drawer/ui/global-admin-drawer").then(
      (module) => module.GlobalAdminDrawer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

export const LazyGlobalAdminDrawerTrigger: React.FC = () => {
  const [isMounted, setIsMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const handleClick = React.useCallback(() => {
    setIsMounted(true);
    setOpen(true);
  }, []);

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={handleClick}>
        <ShieldAlert className="size-4" />
        Глобальный админ
      </Button>
      {isMounted ? (
        <GlobalAdminDrawerDynamic
          open={open}
          onOpenChange={setOpen}
          trigger={null}
        />
      ) : null}
    </>
  );
};
