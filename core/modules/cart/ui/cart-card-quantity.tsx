"use client";

import React from "react";

interface CartCardQuantityProps {
  quantity: number;
}

export const CartCardQuantity: React.FC<CartCardQuantityProps> = ({
  quantity,
}) => {
  return <p>x {quantity}</p>;
};
