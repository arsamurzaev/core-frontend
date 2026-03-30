import { AspectRatio } from "@/shared/ui/aspect-ratio";
import { Badge } from "@/shared/ui/badge";
import { CardContent } from "@/shared/ui/card";
import Image from "next/image";
import React from "react";

interface ProductCardMediaProps {
  imageUrl: string;
  accentLabel?: string;
}

export const ProductCardMedia: React.FC<ProductCardMediaProps> = ({
  imageUrl,
  accentLabel,
}) => {
  return (
    <CardContent className="relative">
      <div className="min-w-25">
        <AspectRatio ratio={3 / 4}>
          <Image
            src={imageUrl || "/not-found-photo.png"}
            fill
            sizes="(max-width: 640px) 100px, 160px"
            unoptimized
            className="object-contain"
            alt="Карточка товара"
          />
        </AspectRatio>
      </div>
      {accentLabel && <Badge className="absolute top-2 right-2">{accentLabel}</Badge>}
    </CardContent>
  );
};
