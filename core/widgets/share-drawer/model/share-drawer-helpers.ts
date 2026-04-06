"use client";

import {
  type ShareActionItem,
  type ShareDrawerMessengerType,
  type ShareDrawerSocialItem,
} from "@/core/widgets/share-drawer/model/share-drawer-types";
import { CatalogContactDtoType } from "@/shared/api/generated/react-query";
import { buildCatalogContactHref } from "@/shared/lib/catalog-contacts";
import { toOptionalTrimmedString } from "@/shared/lib/text";
import { type CatalogWithContacts } from "@/shared/providers/catalog-provider";
import {
  CatalogOwnerGeoIcon,
  CatalogOwnerMailIcon,
  CatalogOwnerPhoneIcon,
} from "@/shared/ui/icons/catalog-owner-icons";

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
  shouldAppendUrl?: boolean;
  url: string;
}): string {
  const normalizedCaption = normalizeText(params.caption);
  const normalizedUrl =
    params.shouldAppendUrl === false ? undefined : normalizeText(params.url);

  return [normalizedCaption, normalizedUrl].filter(Boolean).join("\n");
}

export function getShareDrawerTitle(isShareMode: boolean): string {
  return isShareMode
    ? "Выберите удобный сервис для отправки"
    : "Выберите удобный сервис для связи с нами";
}

function filterAvailableActions(items: Array<ShareActionItem | null>): ShareActionItem[] {
  return items.filter(
    (item): item is ShareActionItem => Boolean(item && (item.href || item.onClick)),
  );
}

function hasCatalogContact(
  catalog: CatalogWithContacts,
  type: CatalogContactDtoType,
): boolean {
  return Boolean(normalizeText(catalog.getContactValue(type)));
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
  shareMessage: string;
  shareUrl: string;
}): ShareActionItem[] {
  const { catalog, isShareMode, shareMessage, shareUrl } = params;

  if (isShareMode) {
    return filterAvailableActions([
      hasCatalogContact(catalog, CatalogContactDtoType.WHATSAPP)
        ? {
            id: "whatsapp",
            label: "Отправить в WhatsApp",
            href: buildCatalogContactHref({
              type: CatalogContactDtoType.WHATSAPP,
              value: catalog.getContactValue(CatalogContactDtoType.WHATSAPP),
              text: shareMessage,
            }),
            imageSrc: "/ui-share-wa-icon.svg",
          }
        : null,
      hasCatalogContact(catalog, CatalogContactDtoType.TELEGRAM)
        ? {
            id: "telegram",
            label: "Отправить в Telegram",
            href: buildCatalogContactHref({
              type: CatalogContactDtoType.TELEGRAM,
              value: catalog.getContactValue(CatalogContactDtoType.TELEGRAM),
              text: shareMessage,
            }),
            imageSrc: "/ui-share-tg-icon.svg",
          }
        : null,
      hasCatalogContact(catalog, CatalogContactDtoType.SMS)
        ? {
            id: "sms",
            label: "Отправить в сообщения",
            href: buildCatalogContactHref({
              type: CatalogContactDtoType.SMS,
              value: catalog.getContactValue(CatalogContactDtoType.SMS),
              text: shareMessage,
            }),
            imageSrc: "/ui-share-phone-icon.svg",
          }
        : null,
    ]);
  }

  return filterAvailableActions([
    {
      id: "whatsapp",
      label: "Напишите нам в WhatsApp",
      href: buildCatalogContactHref({
        type: CatalogContactDtoType.WHATSAPP,
        value: catalog.getContactValue(CatalogContactDtoType.WHATSAPP),
      }),
      imageSrc: "/ui-share-wa-icon.svg",
    },
    {
      id: "telegram",
      label: "Напишите нам в Telegram",
      href: buildCatalogContactHref({
        type: CatalogContactDtoType.TELEGRAM,
        value: catalog.getContactValue(CatalogContactDtoType.TELEGRAM),
      }),
      imageSrc: "/ui-share-tg-icon.svg",
    },
    {
      id: "sms",
      label: "Напишите нам в сообщения",
      href: buildCatalogContactHref({
        type: CatalogContactDtoType.SMS,
        value: catalog.getContactValue(CatalogContactDtoType.SMS),
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
    hasCatalogContact(catalog, CatalogContactDtoType.MAX)
      ? {
          id: "max",
          label: isShareMode
            ? "Поделиться через MAX"
            : "Напишите нам в MAX",
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
        }
      : null,
    hasCatalogContact(catalog, CatalogContactDtoType.BIP)
      ? {
          id: "bip",
          label: isShareMode
            ? "Поделиться через Bip"
            : "Напишите нам в Bip",
          href: !isShareMode
            ? buildCatalogContactHref({
                type: CatalogContactDtoType.BIP,
                value: catalog.getContactValue(CatalogContactDtoType.BIP),
              })
            : undefined,
          onClick: isShareMode ? () => onMessengerAction("bip") : undefined,
          imageSrc: "/bip-icon.svg",
          unoptimized: true,
        }
      : null,
  ]);
}
