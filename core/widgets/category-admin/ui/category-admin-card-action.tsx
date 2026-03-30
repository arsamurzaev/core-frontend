"use client";

import { Button } from "@/shared/ui/button";
import { Pencil } from "lucide-react";
import * as React from "react";

interface CategoryAdminCardActionProps {
  onClick: () => void;
}

export const CategoryAdminCardAction: React.FC<CategoryAdminCardActionProps> = ({
  onClick,
}) => {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="shadow-custom absolute top-3 right-3 z-10 size-[30px] rounded-full bg-white/90 text-foreground opacity-70 backdrop-blur-sm hover:bg-white hover:opacity-100"
      onClick={onClick}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      aria-label="Редактировать категорию"
    >
      <Pencil className="size-4" />
    </Button>
  );
};
