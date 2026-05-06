"use client";

import { createStrictContext, useStrictContext } from "@/shared/lib/react";
import React from "react";

type BlockingDrawerId = "subscription-warning" | (string & {});

interface DrawerCoordinatorContextValue {
  blockingDrawerId: BlockingDrawerId | null;
  hasBlockingDrawer: boolean;
  registerBlockingDrawer: (id: BlockingDrawerId) => () => void;
}

const DrawerCoordinatorContext =
  createStrictContext<DrawerCoordinatorContextValue>();

export const DrawerCoordinatorProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [blockingDrawers, setBlockingDrawers] = React.useState<
    BlockingDrawerId[]
  >([]);

  const registerBlockingDrawer = React.useCallback((id: BlockingDrawerId) => {
    setBlockingDrawers((current) =>
      current.includes(id) ? current : [...current, id],
    );

    return () => {
      setBlockingDrawers((current) =>
        current.filter((currentId) => currentId !== id),
      );
    };
  }, []);

  const blockingDrawerId = blockingDrawers.at(-1) ?? null;
  const value = React.useMemo<DrawerCoordinatorContextValue>(
    () => ({
      blockingDrawerId,
      hasBlockingDrawer: Boolean(blockingDrawerId),
      registerBlockingDrawer,
    }),
    [blockingDrawerId, registerBlockingDrawer],
  );

  return (
    <DrawerCoordinatorContext.Provider value={value}>
      {children}
    </DrawerCoordinatorContext.Provider>
  );
};

export function useDrawerCoordinator() {
  return useStrictContext(DrawerCoordinatorContext);
}
