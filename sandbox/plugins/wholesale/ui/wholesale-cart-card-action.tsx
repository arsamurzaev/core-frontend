"use client";

import React from "react";
import { QuantitySpinbox } from "./quantity-spinbox";

interface WholesaleCartCardActionProps {
  productId: string;
}

export const WholesaleCartCardAction: React.FC<WholesaleCartCardActionProps> = ({
  productId,
}) => {
  return <QuantitySpinbox productId={productId} />;
};
