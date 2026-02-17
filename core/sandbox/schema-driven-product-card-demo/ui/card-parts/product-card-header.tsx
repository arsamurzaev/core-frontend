import {
  CardDescription,
  CardHeader,
  CardSubTitle,
  CardTitle,
} from "@/shared/ui/card";
import React from "react";

interface ProductCardHeaderProps {
  title: string;
  subtitle: string;
  description?: string;
}

export const ProductCardHeaderSection: React.FC<ProductCardHeaderProps> = ({
  title,
  subtitle,
  description,
}) => {
  return (
    <CardHeader className="space-y-2 text-left">
      <CardTitle className="line-clamp-2">{title}</CardTitle>
      <CardSubTitle className="line-clamp-1">{subtitle}</CardSubTitle>
      {description && <CardDescription className="line-clamp-2">{description}</CardDescription>}
    </CardHeader>
  );
};
