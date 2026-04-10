import type { CategoryDto } from "@/shared/api/generated/react-query";
import type React from "react";

export interface BrowserProps {
  className?: string;
  initialCategories?: CategoryDto[];
}

export interface CatalogPlugin {
  typeCode: string;
  filterAccess: "all" | "admin";
  showTabToggle: boolean;
  Browser?: React.ComponentType<BrowserProps>;
  CartCardAction?: React.ComponentType<{ productId: string }>;
}
