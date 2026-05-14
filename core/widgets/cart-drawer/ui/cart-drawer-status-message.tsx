"use client";

import React from "react";

interface CartDrawerStatusMessageProps {
  message: string;
}

export const CartDrawerStatusMessage: React.FC<
  CartDrawerStatusMessageProps
> = ({ message }) => {
  return (
    <div className="rounded-lg border border-[#F0D98A] bg-[#FFF8D9] px-4 py-3">
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};
