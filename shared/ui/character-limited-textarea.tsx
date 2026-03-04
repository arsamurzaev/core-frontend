"use client";

import { forwardRef } from "react";
import type { TextareaAutosizeProps } from "react-textarea-autosize";
import { cn } from "../lib/utils";
import { Textarea } from "./textarea";

interface CharacterLimitedTextareaProps extends Omit<
  TextareaAutosizeProps,
  "maxLength"
> {
  maxLength: number;
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
      ...props
    },
    ref,
  ) => {
    const characterCount = String(value).length;
    const isLimitReached = characterCount >= maxLength;
    const isNearLimit = characterCount >= maxLength * 0.8;

    return (
      <div
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
