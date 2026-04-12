"use client";

import {
  buildShareCaption,
  buildShareDrawerPrimaryActions,
  buildShareDrawerSecondaryActions,
  buildShareDrawerSocialItems,
  buildShareMessage,
  getShareDrawerTitle,
  resolveCurrentAbsoluteUrl,
} from "@/core/widgets/share-drawer/model/share-drawer-helpers";
import { type ShareDrawerMessengerType } from "@/core/widgets/share-drawer/model/share-drawer-types";
import { CatalogContactDtoType } from "@/shared/api/generated/react-query";
import { buildCatalogContactHref } from "@/shared/lib/catalog-contacts";
import { copyTextToClipboard } from "@/shared/lib/clipboard";
import { toOptionalTrimmedString } from "@/shared/lib/text";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { confirm } from "@/shared/ui/confirmation";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";

interface UseShareDrawerParams {
  mode: "contact" | "share";
  title?: string;
  text?: string;
  url?: string;
  drawerTitle?: string;
  copyButtonLabel?: string;
  copyMode?: "message" | "url";
  copySuccessMessage?: string;
  appendUrlToMessage?: boolean;
  messengerConfirmContent: React.ReactNode;
}

const normalizeText = toOptionalTrimmedString;

export function useShareDrawer({
  mode,
  title,
  text,
  url,
  drawerTitle,
  copyButtonLabel,
  copyMode = "url",
  copySuccessMessage,
  appendUrlToMessage = true,
  messengerConfirmContent,
}: UseShareDrawerParams) {
  const catalog = useCatalog();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isShareMode = mode === "share";
  const search = searchParams.toString();

  const currentPathWithQuery = React.useMemo(() => {
    const normalizedPathname = normalizeText(pathname) ?? "/";
    return search ? `${normalizedPathname}?${search}` : normalizedPathname;
  }, [pathname, search]);

  const shareUrl = React.useMemo(() => {
    const source = normalizeText(url) ?? currentPathWithQuery;
    return resolveCurrentAbsoluteUrl(source);
  }, [currentPathWithQuery, url]);

  const shareTitle = React.useMemo(
    () =>
      isShareMode
        ? normalizeText(title) ?? normalizeText(catalog.name) ?? "Каталог"
        : undefined,
    [catalog.name, isShareMode, title],
  );

  const shareText = React.useMemo(() => {
    const explicitText = normalizeText(text);
    if (explicitText) {
      return explicitText;
    }

    if (!isShareMode) {
      return undefined;
    }

    return (
      normalizeText(catalog.config?.about) ??
      normalizeText(catalog.config?.description) ??
      `Посмотрите каталог ${shareTitle ?? ""}`.trim()
    );
  }, [
    catalog.config?.about,
    catalog.config?.description,
    isShareMode,
    shareTitle,
    text,
  ]);

  const shareCaption = React.useMemo(
    () =>
      buildShareCaption({
        title: shareTitle,
        text: shareText,
      }),
    [shareText, shareTitle],
  );

  const shareMessage = React.useMemo(
    () =>
      buildShareMessage({
        caption: shareCaption,
        shouldAppendUrl: appendUrlToMessage,
        url: shareUrl,
      }),
    [appendUrlToMessage, shareCaption, shareUrl],
  );

  const handleCopy = React.useCallback(async () => {
    const valueToCopy =
      copyMode === "message" ? normalizeText(shareMessage) ?? shareUrl : shareUrl;

    if (!valueToCopy) {
      return;
    }

    try {
      await copyTextToClipboard(valueToCopy);
      toast.success(
        copySuccessMessage ??
          (copyMode === "message"
            ? "Текст успешно скопирован."
            : "Ссылка успешно скопирована."),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Не удалось скопировать данные.",
      );
    }
  }, [copyMode, copySuccessMessage, shareMessage, shareUrl]);

  const handleMessengerAction = React.useCallback(
    async (type: ShareDrawerMessengerType) => {
      const contactType =
        type === "max" ? CatalogContactDtoType.MAX : CatalogContactDtoType.BIP;
      const href = buildCatalogContactHref({
        type: contactType,
        value: catalog.getContactValue(contactType),
      });

      if (!href) {
        return;
      }

      const shouldCopyPayloadFirst = isShareMode || Boolean(normalizeText(text));

      try {
        if (!shouldCopyPayloadFirst || !shareMessage) {
          window.open(href, "_blank", "noopener,noreferrer");
          return;
        }

        await copyTextToClipboard(shareMessage);

        const appName = type === "max" ? "MAX" : "Bip";
        const shouldOpen = await confirm({
          title: `Открыть приложение ${appName}`,
          description:
            "Текст уже скопирован. Останется только вставить его и отправить в чат.",
          confirmText: "Далее",
          cancelText: "Отмена",
          children: messengerConfirmContent,
        });

        if (!shouldOpen) {
          return;
        }

        window.open(href, "_blank", "noopener,noreferrer");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Не удалось открыть приложение.",
        );
      }
    },
    [catalog, isShareMode, messengerConfirmContent, shareMessage, text],
  );

  const primaryActions = React.useMemo(
    () =>
      buildShareDrawerPrimaryActions({
        catalog,
        isShareMode,
        shareMessage,
      }),
    [catalog, isShareMode, shareMessage],
  );

  const secondaryActions = React.useMemo(
    () =>
      buildShareDrawerSecondaryActions({
        catalog,
        isShareMode,
        onMessengerAction: handleMessengerAction,
      }),
    [catalog, handleMessengerAction, isShareMode],
  );

  const socialItems = React.useMemo(
    () => buildShareDrawerSocialItems(catalog),
    [catalog],
  );

  return {
    copyButtonLabel:
      normalizeText(copyButtonLabel) ??
      (copyMode === "message" ? "Скопировать текст" : "Скопировать ссылку"),
    drawerTitle: normalizeText(drawerTitle) ?? getShareDrawerTitle(isShareMode),
    handleCopy,
    primaryActions,
    secondaryActions,
    shareUrl,
    socialItems,
  };
}
