"use client";

import { CatalogContactDtoType } from "@/shared/api/generated";
import { buildCatalogContactHref } from "@/shared/lib/catalog-contacts";
import { toOptionalTrimmedString } from "@/shared/lib/text";
import { type CatalogWithContacts } from "@/shared/providers/catalog-provider";
import {
  CatalogOwnerGeoIcon,
  CatalogOwnerMailIcon,
  CatalogOwnerPhoneIcon,
} from "@/shared/ui/icons/catalog-owner-icons";
import type {
  ShareActionItem,
  ShareDrawerMessengerType,
  ShareDrawerSocialItem,
} from "@/core/widgets/share-drawer/model/share-drawer-types";

const normalizeText = toOptionalTrimmedString;

export const SHARE_DRAWER_PLATFORM_URL = "https://catalog.kreati.ru";

export function resolveCurrentAbsoluteUrl(pathOrUrl: string): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return new URL(pathOrUrl, window.location.origin).toString();
  } catch {
    return window.location.href;
  }
}

export function buildShareCaption(params: {
  title?: string;
  text?: string;
}): string {
  return [normalizeText(params.title), normalizeText(params.text)]
    .filter(Boolean)
    .join("\n");
}

export function buildShareMessage(params: {
  caption?: string;
  url: string;
}): string {
  return [normalizeText(params.caption), normalizeText(params.url)]
    .filter(Boolean)
    .join("\n");
}

export function getShareDrawerTitle(isShareMode: boolean): string {
  return isShareMode
    ? "Выберите удобный сервис для отправки каталога"
    : "Выберите удобный сервис для связи с нами";
}

function filterAvailableActions(items: ShareActionItem[]): ShareActionItem[] {
  return items.filter((item) => Boolean(item.href || item.onClick));
}

function buildTelegramShareHref(params: {
  shareCaption: string;
  shareUrl: string;
}): string | undefined {
  const { shareCaption, shareUrl } = params;

  if (!shareUrl) {
    return undefined;
  }

  return `https://t.me/share/url?${new URLSearchParams({
    url: shareUrl,
    ...(shareCaption ? { text: shareCaption } : {}),
  }).toString()}`;
}

export function buildShareDrawerSocialItems(
  catalog: CatalogWithContacts,
): ShareDrawerSocialItem[] {
  return [
    {
      id: "phone",
      href: buildCatalogContactHref({
        type: CatalogContactDtoType.PHONE,
        value: catalog.getContactValue(CatalogContactDtoType.PHONE),
      }),
      icon: CatalogOwnerPhoneIcon,
    },
    {
      id: "email",
      href: buildCatalogContactHref({
        type: CatalogContactDtoType.EMAIL,
        value: catalog.getContactValue(CatalogContactDtoType.EMAIL),
      }),
      icon: CatalogOwnerMailIcon,
    },
    {
      id: "map",
      href: buildCatalogContactHref({
        type: CatalogContactDtoType.MAP,
        value: catalog.getContactValue(CatalogContactDtoType.MAP),
      }),
      icon: CatalogOwnerGeoIcon,
    },
  ]
    .filter((item) => Boolean(item.href))
    .map((item) => ({
      ...item,
      href: item.href as string,
    }));
}

export function buildShareDrawerPrimaryActions(params: {
  catalog: CatalogWithContacts;
  isShareMode: boolean;
  shareCaption: string;
  shareMessage: string;
  shareUrl: string;
}): ShareActionItem[] {
  const { catalog, isShareMode, shareCaption, shareMessage, shareUrl } = params;

  if (isShareMode) {
    return filterAvailableActions([
      {
        id: "whatsapp",
        label: "Отправить в WhatsApp",
        href: buildCatalogContactHref({
          type: CatalogContactDtoType.WHATSAPP,
          value: "https://wa.me/",
          text: shareMessage,
        }),
        imageSrc: "/ui-share-wa-icon.svg",
      },
      {
        id: "telegram",
        label: "Отправить в Telegram",
        href: buildTelegramShareHref({ shareCaption, shareUrl }),
        imageSrc: "/ui-share-tg-icon.svg",
      },
      {
        id: "sms",
        label: "Отправить в Сообщениях",
        href: buildCatalogContactHref({
          type: CatalogContactDtoType.SMS,
          value: "sms:",
          text: shareMessage,
        }),
        imageSrc: "/ui-share-phone-icon.svg",
      },
    ]);
  }

  return filterAvailableActions([
    {
      id: "whatsapp",
      label: "Напишите нам в Whatsapp",
      href: buildCatalogContactHref({
        type: CatalogContactDtoType.WHATSAPP,
        value: catalog.getContactValue(CatalogContactDtoType.WHATSAPP),
        text: shareUrl,
      }),
      imageSrc: "/ui-share-wa-icon.svg",
    },
    {
      id: "telegram",
      label: "Напишите нам в Telegram",
      href: buildCatalogContactHref({
        type: CatalogContactDtoType.TELEGRAM,
        value: catalog.getContactValue(CatalogContactDtoType.TELEGRAM),
        text: shareUrl,
      }),
      imageSrc: "/ui-share-tg-icon.svg",
    },
    {
      id: "sms",
      label: "Напишите нам в Сообщениях",
      href: buildCatalogContactHref({
        type: CatalogContactDtoType.SMS,
        value: catalog.getContactValue(CatalogContactDtoType.SMS),
        text: shareUrl,
      }),
      imageSrc: "/ui-share-phone-icon.svg",
    },
  ]);
}

export function buildShareDrawerSecondaryActions(params: {
  catalog: CatalogWithContacts;
  isShareMode: boolean;
  onMessengerAction: (type: ShareDrawerMessengerType) => void | Promise<void>;
}): ShareActionItem[] {
  const { catalog, isShareMode, onMessengerAction } = params;

  return filterAvailableActions([
    {
      id: "max",
      label: isShareMode ? "Поделиться через MAX" : "Напишите нам в MAX",
      href: !isShareMode
        ? buildCatalogContactHref({
            type: CatalogContactDtoType.MAX,
            value: catalog.getContactValue(CatalogContactDtoType.MAX),
          })
        : undefined,
      onClick: isShareMode ? () => onMessengerAction("max") : undefined,
      imageSrc: "/max-icon.svg",
      unoptimized: true,
      buttonClassName: "overflow-hidden",
      buttonVariant: "default",
    },
    {
      id: "bip",
      label: isShareMode ? "Поделиться через Bip" : "Напишите нам в Bip",
      href: !isShareMode
        ? buildCatalogContactHref({
            type: CatalogContactDtoType.BIP,
            value: catalog.getContactValue(CatalogContactDtoType.BIP),
          })
        : undefined,
      onClick: isShareMode ? () => onMessengerAction("bip") : undefined,
      imageSrc: "/bip-icon.svg",
      unoptimized: true,
    },
  ]);
}
