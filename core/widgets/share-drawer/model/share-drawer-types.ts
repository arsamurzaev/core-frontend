"use client";

import type { ComponentType, ReactNode } from "react";

export interface ShareDrawerProps {
  className?: string;
  trigger?: ReactNode;
  mode?: "contact" | "share";
  title?: string;
  text?: string;
  url?: string;
}

export interface ShareActionItem {
  id: string;
  label: string;
  href?: string;
  imageSrc?: string;
  unoptimized?: boolean;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  buttonClassName?: string;
  buttonVariant?: "default" | "ghost";
}

export interface ShareDrawerSocialItem {
  id: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

export type ShareDrawerMessengerType = "max" | "bip";
