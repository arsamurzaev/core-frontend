"use client";

import { LazyShareDrawerTrigger } from "@/core/widgets/share-drawer/ui/lazy-share-drawer-trigger";
import { copyTextToClipboard } from "@/shared/lib/clipboard";
import { Button } from "@/shared/ui/button";
import { CircleHelp, Reply } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface ProductDrawerShareActionsProps {
  text?: string;
  title: string;
}

function ProductDrawerNativeShareButton({
  text,
  title,
}: ProductDrawerShareActionsProps) {
  const handleShare = React.useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) {
      return;
    }

    const shareData: ShareData = {
      title,
      text,
      url,
    };

    try {
      if (
        typeof navigator.share === "function" &&
        (typeof navigator.canShare !== "function" ||
          navigator.canShare(shareData))
      ) {
        await navigator.share(shareData);
        return;
      }

      await copyTextToClipboard(url);
      toast.success("Ссылка на товар скопирована");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      try {
        await copyTextToClipboard(url);
        toast.success("Ссылка на товар скопирована");
      } catch {
        toast.error("Не удалось поделиться товаром");
      }
    }
  }, [text, title]);

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="shadow-custom opacity-70"
      onClick={handleShare}
      aria-label="Поделиться товаром"
    >
      <Reply className="size-5" />
    </Button>
  );
}

export function ProductDrawerShareActions({
  text,
  title,
}: ProductDrawerShareActionsProps) {
  return (
    <div className="absolute top-2 right-2 flex flex-col gap-2">
      <LazyShareDrawerTrigger
        mode="share"
        title={title}
        text={text}
        trigger={
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="shadow-custom opacity-70"
            aria-label="Открыть способы отправки"
          >
            <CircleHelp className="size-5" />
          </Button>
        }
      />
      <ProductDrawerNativeShareButton title={title} text={text} />
    </div>
  );
}
