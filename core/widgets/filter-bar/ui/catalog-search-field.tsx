"use client";

import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";
import { Search } from "lucide-react";
import React from "react";

interface CatalogSearchFieldProps {
  value: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export const CatalogSearchField: React.FC<CatalogSearchFieldProps> = ({
  value,
  className,
  inputClassName,
  autoFocus = false,
  onChange,
  onSubmit,
}) => {
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") {
        return;
      }

      onSubmit();
    },
    [onSubmit],
  );

  return (
    <div
      className={cn(
        "shadow-custom relative w-full flex-1 rounded-full",
        className,
      )}
    >
      <Input
        type="search"
        name="catalog-search"
        value={value}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Поиск"
        aria-label="Поиск"
        className={cn("h-10 rounded-full pr-11 pl-4", inputClassName)}
      />
      <button
        type="button"
        onClick={onSubmit}
        aria-label="Применить поиск"
        className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded-full p-0.5"
      >
        <Search className="h-5 w-5" />
      </button>
    </div>
  );
};
