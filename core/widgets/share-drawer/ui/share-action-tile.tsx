"use client";

import { type ShareActionItem } from "@/core/widgets/share-drawer/model/share-drawer-types";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import Image from "next/image";

interface ShareActionTileProps {
  item: ShareActionItem;
}

export function ShareActionTile({ item }: ShareActionTileProps) {
  const content = item.imageSrc ? (
    <Image
      src={item.imageSrc}
      width={60}
      height={60}
      className="h-full w-full object-cover"
      alt=""
      unoptimized={item.unoptimized}
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
          <a href={item.href} target="_blank" rel="noopener noreferrer">
            {content}
          </a>
        </Button>
      ) : (
        <Button
          type="button"
          variant={item.buttonVariant ?? "ghost"}
          size="icon"
          className={cn("size-[60px]", item.buttonClassName)}
          onClick={item.onClick}
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
