"use client";

import { type ShareActionItem } from "@/core/widgets/share-drawer/model/share-drawer-types";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";


interface ShareActionTileProps {
  item: ShareActionItem;
  onActionClick?: () => void;
}

export function ShareActionTile({ item, onActionClick }: ShareActionTileProps) {
  const content = item.imageSrc ? (
    <img
      src={item.imageSrc}
      className="h-full w-full object-cover"
      alt=""
    />
  ) : null;

  return (
    <div className="basis-1/4 text-center">
      {item.href && !item.disabled ? (
        <Button
          asChild
          variant={item.buttonVariant ?? "ghost"}
          size="icon"
          className={cn("size-[60px]", item.buttonClassName)}
          aria-label={item.label}
        >
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onActionClick}
          >
            {content}
          </a>
        </Button>
      ) : (
        <Button
          type="button"
          variant={item.buttonVariant ?? "ghost"}
          size="icon"
          className={cn("size-[60px]", item.buttonClassName)}
          onClick={() => {
            onActionClick?.();
            void item.onClick?.();
          }}
          disabled={item.disabled}
          aria-label={item.label}
        >
          {content}
        </Button>
      )}
      <p className="text-xs">{item.label}</p>
    </div>
  );
}
