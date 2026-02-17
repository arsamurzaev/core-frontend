import { cn } from "@/shared/lib/utils";
import { Card } from "@/shared/ui/card";
import React from "react";

interface ProductCardShellProps {
  className?: string;
  children: React.ReactNode;
}

export const ProductCardShell: React.FC<ProductCardShellProps> = ({
  className,
  children,
}) => {
  return (
    <Card className={cn("relative flex flex-col gap-2 overflow-hidden rounded-lg border", className)}>
      {children}
    </Card>
  );
};
