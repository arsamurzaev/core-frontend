"use client";

import { createStrictContext, useStrictContext } from "@/shared/lib/react";
import dynamic from "next/dynamic";
import React from "react";

const EDIT_PRODUCT_DRAWER_CLOSE_DELAY_MS = 320;

const EditProductDrawerDynamic = dynamic(
  () =>
    import("@/core/widgets/edit-product-drawer/ui/edit-product-drawer").then(
      (module) => module.EditProductDrawer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

interface EditProductDrawerHostValue {
  openDrawer: (productId: string) => void;
}

const EditProductDrawerHostContext =
  createStrictContext<EditProductDrawerHostValue>();

export const EditProductDrawerHostProvider: React.FC<
  React.PropsWithChildren<{
    supportsBrands?: boolean;
    supportsCategoryDetails?: boolean;
  }>
> = ({
  children,
  supportsBrands = true,
  supportsCategoryDetails = true,
}) => {
  const [isMounted, setIsMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [productId, setProductId] = React.useState<string | null>(null);
  const closeTimerRef = React.useRef<number | null>(null);

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimerRef.current === null) {
      return;
    }

    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  React.useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, [clearCloseTimer]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      clearCloseTimer();
      setIsOpen(nextOpen);

      if (nextOpen) {
        return;
      }

      closeTimerRef.current = window.setTimeout(() => {
        setProductId(null);
        closeTimerRef.current = null;
      }, EDIT_PRODUCT_DRAWER_CLOSE_DELAY_MS);
    },
    [clearCloseTimer],
  );

  const openDrawer = React.useCallback(
    (nextProductId: string) => {
      clearCloseTimer();
      setIsMounted(true);
      setProductId(nextProductId);
      setIsOpen(true);
    },
    [clearCloseTimer],
  );

  return (
    <EditProductDrawerHostContext.Provider value={{ openDrawer }}>
      {children}
      {isMounted && productId ? (
        <EditProductDrawerDynamic
          productId={productId}
          open={isOpen}
          onOpenChange={handleOpenChange}
          supportsBrands={supportsBrands}
          supportsCategoryDetails={supportsCategoryDetails}
        />
      ) : null}
    </EditProductDrawerHostContext.Provider>
  );
};

export function useEditProductDrawerHost() {
  return useStrictContext(EditProductDrawerHostContext);
}
