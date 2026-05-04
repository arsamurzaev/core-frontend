"use client";

import { type ShareDrawerProps } from "@/core/widgets/share-drawer/model/share-drawer-types";
import { useShareDrawer } from "@/core/widgets/share-drawer/model/use-share-drawer";
import { ShareActionTile } from "@/core/widgets/share-drawer/ui/share-action-tile";
import { ShareDrawerBrand } from "@/core/widgets/share-drawer/ui/share-drawer-brand";
import { ShareDrawerConfirmContent } from "@/core/widgets/share-drawer/ui/share-drawer-confirm-content";
import { ShareDrawerHeader } from "@/core/widgets/share-drawer/ui/share-drawer-header";
import { ShareDrawerSocialList } from "@/core/widgets/share-drawer/ui/share-drawer-social-list";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import React from "react";

export const ShareDrawer: React.FC<ShareDrawerProps> = ({
  className,
  trigger = (
    <Button className="w-full font-semibold" variant="outline">
      Связаться с нами
    </Button>
  ),
  mode = "contact",
  title,
  text,
  url,
  drawerTitle,
  copyButtonLabel,
  copyMode,
  copySuccessMessage,
  appendUrlToMessage,
  open,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const resolvedOpen = isControlled ? open : internalOpen;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  const closeDrawer = React.useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  const messengerConfirmContent = React.useMemo(
    () => <ShareDrawerConfirmContent />,
    [],
  );

  const {
    copyButtonLabel: resolvedCopyButtonLabel,
    drawerTitle: resolvedDrawerTitle,
    handleCopy,
    primaryActions,
    secondaryActions,
    shareUrl,
    socialItems,
  } = useShareDrawer({
    mode,
    title,
    text,
    url,
    drawerTitle,
    copyButtonLabel,
    copyMode,
    copySuccessMessage,
    appendUrlToMessage,
    messengerConfirmContent,
  });

  return (
    <AppDrawer
      className={className}
      trigger={trigger}
      open={resolvedOpen}
      onOpenChange={handleOpenChange}
    >
      <AppDrawer.Content className="bg-[#F2F2F7] text-center">
        <ShareDrawerHeader title={resolvedDrawerTitle} />

        <div className="space-y-8">
          <div className="flex flex-wrap justify-evenly">
            {primaryActions.map((item) => (
              <ShareActionTile
                key={item.id}
                item={item}
                onActionClick={closeDrawer}
              />
            ))}
          </div>

          {secondaryActions.length > 0 ? (
            <div className="flex justify-evenly">
              {secondaryActions.map((item) => (
                <ShareActionTile
                  key={item.id}
                  item={item}
                  onActionClick={closeDrawer}
                />
              ))}
            </div>
          ) : null}

          <ShareDrawerSocialList
            items={socialItems}
            onItemClick={closeDrawer}
          />

          <p>
            <span className="text-xs">или вы можете</span>
            <br />
            <button
              type="button"
              className="underline disabled:opacity-50"
              onClick={handleCopy}
              disabled={!shareUrl}
            >
              {resolvedCopyButtonLabel}
            </button>
          </p>

          <ShareDrawerBrand />
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
