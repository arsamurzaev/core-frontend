"use client";

import {
  useCatalogAdvancedSettingsControllerGetIikoStatus,
  useCatalogAdvancedSettingsControllerGetMoySkladStatus,
} from "@/shared/api/generated/react-query";
import { useCatalogCapabilities } from "@/shared/capabilities/catalog-capabilities";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import dynamic from "next/dynamic";
import React from "react";
import { toast } from "sonner";

const CreateProductDrawerDynamic = dynamic(
  () =>
    import("@/core/widgets/create-product-drawer").then(
      (module) => module.CreateProductDrawer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

interface LazyCreateProductDrawerTriggerProps {
  className?: string;
  supportsBrands?: boolean;
  supportsCategoryDetails?: boolean;
}

export const LazyCreateProductDrawerTrigger: React.FC<
  LazyCreateProductDrawerTriggerProps
> = ({ className, supportsBrands = true, supportsCategoryDetails = true }) => {
  const features = useCatalogCapabilities();
  const [isMounted, setIsMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const moySkladStatusQuery = useCatalogAdvancedSettingsControllerGetMoySkladStatus({
    query: {
      enabled: features.canUseMoySkladIntegration,
      staleTime: 30_000,
    },
  });
  const iikoStatusQuery = useCatalogAdvancedSettingsControllerGetIikoStatus({
    query: {
      enabled: features.canUseIikoIntegration,
      staleTime: 30_000,
    },
  });

  const hasConfiguredIntegration = Boolean(
    (features.canUseMoySkladIntegration && moySkladStatusQuery.data?.configured) ||
      (features.canUseIikoIntegration && iikoStatusQuery.data?.configured),
  );

  const handleClick = React.useCallback(() => {
    if (hasConfiguredIntegration) {
      toast.error(
        "Создание товаров вручную отключено: каталог управляется интеграцией.",
      );
      return;
    }

    setIsMounted(true);
    setOpen(true);
  }, [hasConfiguredIntegration]);

  return (
    <>
      <Button
        className={cn("col-span-2", className)}
        onClick={handleClick}
        title={
          hasConfiguredIntegration
            ? "Товары создаются через синхронизацию интеграции"
            : undefined
        }
        variant={hasConfiguredIntegration ? "outline" : "default"}
      >
        + Добавить позицию
      </Button>
      {isMounted ? (
        <CreateProductDrawerDynamic
          open={open}
          onOpenChange={setOpen}
          supportsBrands={supportsBrands}
          supportsCategoryDetails={supportsCategoryDetails}
          trigger={null}
        />
      ) : null}
    </>
  );
};
