"use client";

import { type FieldOption } from "@/shared/ui/dynamic-form";

export const EMPTY_FIELD_OPTIONS: FieldOption[] = [];

export function getFieldOptionText(option: FieldOption): string {
  return typeof option.label === "string"
    ? option.label
    : typeof option.value === "string"
      ? option.value
      : String(option.value);
}

export function normalizeSingleLineText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function areStringSetsEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const leftSet = new Set(left);
  for (const item of right) {
    if (!leftSet.has(item)) {
      return false;
    }
  }

  return true;
}
