"use client";

import React from "react";

interface CartDrawerStatusMessageProps {
  message: string;
}

export const CartDrawerStatusMessage: React.FC<
  CartDrawerStatusMessageProps
> = ({ message }) => {
  return (
    <div className="rounded-lg border border-status-warning/35 bg-status-warning-surface px-4 py-3 text-status-warning-foreground">
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};
