"use client";

import { CatalogContactDtoType } from "@/shared/api/generated";
import { buildCatalogContactHref } from "@/shared/lib/catalog-contacts";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { KreatiLogo } from "@/shared/ui/icons/kreati-logo";
import { Copy, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";

interface ShareDrawerProps {
  className?: string;
  trigger?: React.ReactNode;
  mode?: "contact" | "share";
  title?: string;
  text?: string;
  url?: string;
}

interface ShareActionItem {
  id: string;
  label: string;
  href?: string;
  imageSrc?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
}

const PLATFORM_URL = "https://catalog.kreati.ru";

function normalizeText(value?: string | null): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function resolveCurrentAbsoluteUrl(pathOrUrl: string): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return new URL(pathOrUrl, window.location.origin).toString();
  } catch {
    return window.location.href;
  }
}

function buildShareCaption({
  title,
  text,
}: {
  title?: string;
  text?: string;
}): string {
  return [normalizeText(title), normalizeText(text)].filter(Boolean).join("\n");
}

function buildShareMessage({
  caption,
  url,
}: {
  caption?: string;
  url: string;
}): string {
  return [normalizeText(caption), normalizeText(url)].filter(Boolean).join("\n");
}

async function copyToClipboard(value: string): Promise<void> {
  if (!value) {
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();

  const isCopied = document.execCommand("copy");
  document.body.removeChild(textArea);

  if (!isCopied) {
    throw new Error("Не удалось скопировать ссылку");
  }
}

const ShareActionTile: React.FC<{ item: ShareActionItem }> = ({ item }) => {
  const Icon = item.icon;
  const iconButtonClassName = item.imageSrc
    ? "size-[60px] overflow-hidden rounded-full p-0"
    : "size-[60px] rounded-full p-0";

  const content = item.imageSrc ? (
    <Image
      src={item.imageSrc}
      width={60}
      height={60}
      className="h-full w-full object-cover"
      alt={item.label}
    />
  ) : Icon ? (
    <span className="bg-secondary inline-flex size-[52px] items-center justify-center rounded-full">
      <Icon className="size-6 text-[#2167C7]" />
    </span>
  ) : null;

  return (
    <div className="basis-1/4 text-center">
      {item.href && !item.disabled ? (
        <Button asChild variant="ghost" size="icon" className={iconButtonClassName}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
          >
            {content}
          </a>
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={iconButtonClassName}
          onClick={item.onClick}
          disabled={item.disabled}
          aria-label={item.label}
        >
          {content}
        </Button>
      )}

      <p className="mt-2 text-xs">{item.label}</p>
    </div>
  );
};

const ShareDrawerBrand: React.FC = () => {
  return (
    <p className="text-muted-foreground flex flex-col items-center text-center text-sm">
      Разработано на платформе
      <br />
      <Link href={PLATFORM_URL} target="_blank" rel="noopener noreferrer">
        <span className="text-foreground inline-flex items-center gap-2">
          <KreatiLogo className="h-8 w-auto" />
          <span className="text-base font-medium">Kreati</span>
        </span>
      </Link>
    </p>
  );
};

function filterAvailableActions(items: ShareActionItem[]): ShareActionItem[] {
  return items.filter((item) => Boolean(item.href));
}

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
}) => {
  const catalog = useCatalog();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [shareUrl, setShareUrl] = React.useState("");

  const search = searchParams.toString();

  const currentPathWithQuery = React.useMemo(() => {
    const normalizedPathname = normalizeText(pathname) ?? "/";
    return search ? `${normalizedPathname}?${search}` : normalizedPathname;
  }, [pathname, search]);

  React.useEffect(() => {
    const source = normalizeText(url) ?? currentPathWithQuery;
    setShareUrl(resolveCurrentAbsoluteUrl(source));
  }, [currentPathWithQuery, url]);

  const isShareMode = mode === "share";

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
      `Посмотрите каталог ${shareTitle}`
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
        url: shareUrl,
      }),
    [shareCaption, shareUrl],
  );

  const shareData = React.useMemo<ShareData>(
    () => ({
      title: isShareMode ? shareTitle : undefined,
      text: isShareMode ? shareText : undefined,
      url: shareUrl,
    }),
    [isShareMode, shareText, shareTitle, shareUrl],
  );

  const isShareReady = Boolean(shareUrl);
  const isPrimaryActionsReady = isShareMode ? isShareReady : true;

  const handleCopy = React.useCallback(async () => {
    if (!shareUrl) {
      return;
    }

    try {
      await copyToClipboard(shareUrl);
      toast.success("Ссылка на каталог скопирована");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Не удалось скопировать ссылку",
      );
    }
  }, [shareUrl]);

  const handleNativeShare = React.useCallback(async () => {
    if (!shareUrl) {
      return;
    }

    try {
      if (typeof navigator.share !== "function") {
        await copyToClipboard(shareUrl);
        toast.success("Системное меню недоступно, ссылка скопирована");
        return;
      }

      if (typeof navigator.canShare === "function" && !navigator.canShare(shareData)) {
        await copyToClipboard(shareUrl);
        toast.success("Этот способ недоступен на устройстве, ссылка скопирована");
        return;
      }

      await navigator.share(shareData);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      toast.error(error instanceof Error ? error.message : "Не удалось поделиться");
    }
  }, [shareData, shareUrl]);

  const contactPrimaryActions = React.useMemo<ShareActionItem[]>(
    () =>
      filterAvailableActions([
        {
          id: "whatsapp",
          label: "Отправить в WhatsApp",
          href: buildCatalogContactHref({
            type: CatalogContactDtoType.WHATSAPP,
            value: catalog.getContactValue(CatalogContactDtoType.WHATSAPP),
          }),
          imageSrc: "/ui-share-wa-icon.svg",
        },
        {
          id: "telegram",
          label: "Отправить в Telegram",
          href: buildCatalogContactHref({
            type: CatalogContactDtoType.TELEGRAM,
            value: catalog.getContactValue(CatalogContactDtoType.TELEGRAM),
          }),
          imageSrc: "/ui-share-tg-icon.svg",
        },
        {
          id: "sms",
          label: "Отправить в Сообщения",
          href: buildCatalogContactHref({
            type: CatalogContactDtoType.SMS,
            value: catalog.getContactValue(CatalogContactDtoType.SMS),
          }),
          imageSrc: "/ui-share-phone-icon.svg",
        },
      ]),
    [catalog],
  );

  const contactSecondaryActions = React.useMemo<ShareActionItem[]>(
    () =>
      filterAvailableActions([
        {
          id: "max",
          label: "Написать в MAX",
          href: buildCatalogContactHref({
            type: CatalogContactDtoType.MAX,
            value: catalog.getContactValue(CatalogContactDtoType.MAX),
          }),
          imageSrc: "/max-icon.svg",
        },
        {
          id: "bip",
          label: "Написать в Bip",
          href: buildCatalogContactHref({
            type: CatalogContactDtoType.BIP,
            value: catalog.getContactValue(CatalogContactDtoType.BIP),
          }),
          imageSrc: "/bip-icon.svg",
        },
      ]),
    [catalog],
  );

  const primaryActions = React.useMemo<ShareActionItem[]>(
    () =>
      isShareMode
        ? [
            {
              id: "whatsapp",
              label: "Отправить в WhatsApp",
              href: buildCatalogContactHref({
                type: CatalogContactDtoType.WHATSAPP,
                value: "https://wa.me/",
                text: shareMessage,
              }),
              imageSrc: "/ui-share-wa-icon.svg",
              disabled: !isPrimaryActionsReady,
            },
            {
              id: "telegram",
              label: "Отправить в Telegram",
              href: `https://t.me/share/url?${new URLSearchParams({
                url: shareUrl,
                ...(shareCaption ? { text: shareCaption } : {}),
              }).toString()}`,
              imageSrc: "/ui-share-tg-icon.svg",
              disabled: !isPrimaryActionsReady,
            },
            {
              id: "sms",
              label: "Отправить в Сообщения",
              href: buildCatalogContactHref({
                type: CatalogContactDtoType.SMS,
                value: "sms:",
                text: shareMessage,
              }),
              imageSrc: "/ui-share-phone-icon.svg",
              disabled: !isPrimaryActionsReady,
            },
          ]
        : contactPrimaryActions,
    [
      contactPrimaryActions,
      isPrimaryActionsReady,
      isShareMode,
      shareCaption,
      shareMessage,
      shareUrl,
    ],
  );

  const secondaryActions = React.useMemo<ShareActionItem[]>(
    () =>
      isShareMode
        ? [
            {
              id: "native-share",
              label: "Поделиться через систему",
              onClick: handleNativeShare,
              icon: Share2,
              disabled: !isShareReady,
            },
            {
              id: "copy-link",
              label: "Скопировать ссылку",
              onClick: handleCopy,
              icon: Copy,
              disabled: !isShareReady,
            },
          ]
        : contactSecondaryActions,
    [
      contactSecondaryActions,
      handleCopy,
      handleNativeShare,
      isShareMode,
      isShareReady,
    ],
  );

  return (
    <AppDrawer className={className} trigger={trigger}>
      <AppDrawer.Content className="max-h-[40%] min-h-[490px] bg-[#F2F2F7] text-center">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title={
              isShareMode
                ? "Выберите удобный сервис для отправки каталога"
                : "Выберите удобный сервис для связи с нами"
            }
            description={null}
          />

          <div className="space-y-8 pb-8">
            <div className="flex flex-wrap justify-evenly px-4">
              {primaryActions.map((item) => (
                <ShareActionTile key={item.id} item={item} />
              ))}
            </div>

            {secondaryActions.length > 0 ? (
              <div className="flex justify-evenly px-4">
                {secondaryActions.map((item) => (
                  <ShareActionTile key={item.id} item={item} />
                ))}
              </div>
            ) : null}

            <p>
              <span className="text-xs">или вы можете</span>
              <br />
              <button
                type="button"
                className="underline disabled:opacity-50"
                onClick={handleCopy}
                disabled={!isShareReady}
              >
                скопировать ссылку на каталог
              </button>
            </p>

            <ShareDrawerBrand />
          </div>
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
