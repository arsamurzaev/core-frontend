import { cn } from "@/shared/lib/utils";
import React from "react";

interface Props {
  className?: string;
}

export const CellProductCard: React.FC<Props> = ({ className }) => {
  return <div className={cn(className)}></div>;
};
