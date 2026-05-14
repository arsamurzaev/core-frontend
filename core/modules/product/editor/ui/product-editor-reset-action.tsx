"use client";

import { RefreshCcw } from "lucide-react";
import React from "react";

interface ProductEditorResetActionProps {
  disabled?: boolean;
  onReset: () => void;
}

export const ProductEditorResetAction: React.FC<
  ProductEditorResetActionProps
> = ({ disabled, onReset }) => {
  return (
    <button
      type="button"
      onClick={onReset}
      disabled={disabled}
      className="rounded p-1 transition-colors hover:bg-gray-100 disabled:opacity-50"
      title="Очистить форму"
    >
      <RefreshCcw className="size-5" />
    </button>
  );
};
