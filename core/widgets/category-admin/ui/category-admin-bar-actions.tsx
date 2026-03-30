"use client";

import { Button } from "@/shared/ui/button";
import { List, Plus } from "lucide-react";
import * as React from "react";

interface CategoryAdminBarActionsProps {
  canReorder: boolean;
  disabled?: boolean;
  onCreateClick: () => void;
  onReorderClick: () => void;
}

export const CategoryAdminBarActions: React.FC<CategoryAdminBarActionsProps> = ({
  canReorder,
  disabled = false,
  onCreateClick,
  onReorderClick,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        variant="ghost"
        className="shadow-custom h-auto rounded-lg bg-white px-3 py-3 text-sm hover:bg-white/95 sm:text-base"
        disabled={disabled}
        onClick={onCreateClick}
      >
        <Plus className="size-4" />
        <span className="truncate">Добавить категорию</span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="shadow-custom h-auto rounded-lg bg-white px-3 py-3 text-sm hover:bg-white/95 sm:text-base"
        disabled={disabled || !canReorder}
        onClick={onReorderClick}
      >
        <List className="size-4" />
        <span className="truncate">Изменить порядок</span>
      </Button>
    </div>
  );
};
