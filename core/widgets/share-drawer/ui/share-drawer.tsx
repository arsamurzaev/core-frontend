"use client";

import { useShareDrawer } from "@/core/widgets/share-drawer/model/use-share-drawer";
import { type ShareDrawerProps } from "@/core/widgets/share-drawer/model/share-drawer-types";
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
      open={open}
      onOpenChange={onOpenChange}
    >
      <AppDrawer.Content className="max-h-[40%] min-h-[490px] bg-[#F2F2F7] text-center">
        <ShareDrawerHeader title={resolvedDrawerTitle} />

        <div className="space-y-8">
          <div className="flex flex-wrap justify-evenly">
            {primaryActions.map((item) => (
              <ShareActionTile key={item.id} item={item} />
            ))}
          </div>

          {secondaryActions.length > 0 ? (
            <div className="flex justify-evenly">
              {secondaryActions.map((item) => (
                <ShareActionTile key={item.id} item={item} />
              ))}
            </div>
          ) : null}

          <ShareDrawerSocialList items={socialItems} />

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
