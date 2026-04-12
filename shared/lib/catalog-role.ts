import { AuthUserDtoRole } from "@/shared/api/generated/react-query";

export function isCatalogManagerRole(role?: string | null): boolean {
  return role === AuthUserDtoRole.ADMIN || role === AuthUserDtoRole.CATALOG;
}
