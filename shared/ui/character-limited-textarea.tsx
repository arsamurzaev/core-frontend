"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib/utils";
import { Textarea } from "./textarea";

interface CharacterLimitedTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "maxLength" | "rows"> {
  maxLength: number;
  minRows?: number;
  maxRows?: number;
  rows?: number;
  showCounter?: boolean;
  className?: string;
  containerClassName?: string;
  counterClassName?: string;
}

export const CharacterLimitedTextarea = forwardRef<
  HTMLTextAreaElement,
  CharacterLimitedTextareaProps
>(
  (
    {
      maxLength,
      showCounter = true,
      className,
      counterClassName,
      containerClassName,
      value = "",
      rows,
      minRows,
      maxRows,
      ...props
    },
    ref,
  ) => {
    const characterCount = String(value).length;
    const isLimitReached = characterCount >= maxLength;
    const isNearLimit = characterCount >= maxLength * 0.8;

    return (
      <div
        data-max-rows={maxRows}
        className={cn(
          "border-muted-foreground relative border-b pb-5",
          isLimitReached && "border-red-500 focus-visible:ring-red-500",
          containerClassName,
        )}
      >
        <Textarea
          ref={ref}
          className={cn(className)}
          maxLength={maxLength}
          rows={rows ?? minRows}
          value={value}
          {...props}
        />
        {showCounter && (
          <div
            className={cn(
              "pointer-events-none absolute right-2 bottom-2 text-xs font-medium transition-colors",
              isLimitReached
                ? "text-red-500"
                : isNearLimit
                  ? "text-yellow-600"
                  : "text-muted-foreground",
              counterClassName,
            )}
            aria-live="polite"
          >
            {characterCount}/{maxLength}
          </div>
        )}
      </div>
    );
  },
);

CharacterLimitedTextarea.displayName = "CharacterLimitedTextarea";
