"use client";

import * as React from "react";

import { formatPhoneInput, PHONE_MASK_MAX_LENGTH } from "@/shared/lib/phone";
import { Input } from "@/shared/ui/input";

type PhoneInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "onChange" | "type" | "value"
> & {
  value?: string | null;
  onValueChange?: (value: string) => void;
};

const DIGIT_RE = /\d/;
const NON_DIGIT_RE = /\D/g;

function getCursorPosition(value: string, digitsBeforeCursor: number): number {
  if (digitsBeforeCursor <= 0) {
    return value.startsWith("+") ? 1 : 0;
  }

  let digitCount = 0;

  for (let index = 0; index < value.length; index += 1) {
    if (!DIGIT_RE.test(value[index])) {
      continue;
    }

    digitCount += 1;

    if (digitCount === digitsBeforeCursor) {
      return index + 1;
    }
  }

  return value.length;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ maxLength, onValueChange, value, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const displayValue = React.useMemo(
      () => formatPhoneInput(typeof value === "string" ? value : ""),
      [value],
    );

    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;

        if (typeof ref === "function") {
          ref(node);
          return;
        }

        if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    const restoreCaret = React.useCallback(
      (nextValue: string, digitsBeforeCursor: number) => {
        const input = inputRef.current;
        if (!input) {
          return;
        }

        const nextCursorPosition = getCursorPosition(
          nextValue,
          digitsBeforeCursor,
        );

        requestAnimationFrame(() => {
          if (document.activeElement !== input) {
            return;
          }

          input.setSelectionRange(nextCursorPosition, nextCursorPosition);
        });
      },
      [],
    );

    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = event.target.value;
        const selectionStart = event.target.selectionStart ?? rawValue.length;
        const digitsBeforeCursor = rawValue
          .slice(0, selectionStart)
          .replace(NON_DIGIT_RE, "").length;
        const formattedValue = formatPhoneInput(rawValue);
        const nextValue = formattedValue === "+" ? "" : formattedValue;

        onValueChange?.(nextValue);
        restoreCaret(nextValue, digitsBeforeCursor);
      },
      [onValueChange, restoreCaret],
    );

    return (
      <Input
        {...props}
        ref={setRefs}
        type="tel"
        value={displayValue}
        onChange={handleChange}
        maxLength={maxLength ?? PHONE_MASK_MAX_LENGTH}
      />
    );
  },
);

PhoneInput.displayName = "PhoneInput";
