import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type CatalogLike = {
  name?: string
  slug?: string
  domain?: string | null
  type?: {
    code?: string | null
  } | null
  config?: {
    status?: string | null
    logoUrl?: string | null
    bgUrl?: string | null
    currency?: string | null
    about?: string | null
    description?: string | null
  } | null
  settings?: {
    isActive?: boolean
    isCommerceEnabled?: boolean
    productsDisplayMode?: string | null
  } | null
}

export function getCatalogDisplayName(catalog?: CatalogLike | null): string {
  if (!catalog) return ""
  const name = catalog.name?.trim()
  if (name) return name
  const slug = catalog.slug?.trim()
  if (slug) return slug
  const domain = catalog.domain?.trim()
  return domain ?? ""
}

export function getCatalogDomainOrSlug(catalog?: CatalogLike | null): string {
  if (!catalog) return ""
  const domain = catalog.domain?.trim()
  if (domain) return domain
  return catalog.slug?.trim() ?? ""
}

export function getCatalogLogoUrl(catalog?: CatalogLike | null): string | null {
  return catalog?.config?.logoUrl ?? null
}

export function getCatalogBackgroundUrl(
  catalog?: CatalogLike | null
): string | null {
  return catalog?.config?.bgUrl ?? null
}

export function isCatalogActive(catalog?: CatalogLike | null): boolean {
  return Boolean(catalog?.settings?.isActive)
}

export function isCatalogCommerceEnabled(catalog?: CatalogLike | null): boolean {
  return Boolean(catalog?.settings?.isCommerceEnabled)
}

export function isCatalogOperational(catalog?: CatalogLike | null): boolean {
  return catalog?.config?.status === "OPERATIONAL"
}

export function getCatalogCurrency(
  catalog?: CatalogLike | null,
  fallback = "RUB"
): string {
  const value = catalog?.config?.currency
  if (!value) return fallback
  const trimmed = value.trim()
  return trimmed ? trimmed : fallback
}
