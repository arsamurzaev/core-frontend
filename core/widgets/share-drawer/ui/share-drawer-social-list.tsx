"use client";

import { type ShareDrawerSocialItem } from "@/core/widgets/share-drawer/model/share-drawer-types";
import Link from "next/link";

interface ShareDrawerSocialListProps {
  items: ShareDrawerSocialItem[];
  onItemClick?: () => void;
}

export function ShareDrawerSocialList({
  items,
  onItemClick,
}: ShareDrawerSocialListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav>
      <ul className="flex justify-center gap-8 text-[#8C8C8C]">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <li key={item.id}>
              <Link
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onItemClick}
              >
                <Icon />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
