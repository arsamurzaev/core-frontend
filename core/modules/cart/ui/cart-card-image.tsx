"use client";

import React from "react";

const CART_CARD_FALLBACK_IMAGE_URL = "/not-found-photo.png";

interface CartCardImageProps {
  imageUrl: string;
  name: string;
}

export const CartCardImage: React.FC<CartCardImageProps> = ({
  imageUrl,
  name,
}) => {
  const alt = name.trim() ? `Фото товара: ${name}` : "Фото товара";

  return (
    <div className="relative aspect-[3/4] h-25 sm:h-[150px]">
      <img
        src={imageUrl || CART_CARD_FALLBACK_IMAGE_URL}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
};
