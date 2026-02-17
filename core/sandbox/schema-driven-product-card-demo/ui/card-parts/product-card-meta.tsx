import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import React from "react";

interface ProductCardMetaProps {
  className?: string;
  metaLabel?: string;
  metaValue?: string;
  chips?: string[];
}

export const ProductCardMeta: React.FC<ProductCardMetaProps> = ({
  className,
  metaLabel,
  metaValue,
  chips = [],
}) => {
  const hasMeta = Boolean(metaLabel && metaValue);

  if (!hasMeta && chips.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {hasMeta && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{metaLabel}:</span> {metaValue}
        </p>
      )}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <Badge key={chip} variant="outline" className="text-[10px]">
              {chip}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
