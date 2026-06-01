"use client";

import React from "react";
import {
  PRODUCT_CARD_DETAILED_ROW_ESTIMATE_PX,
  PRODUCT_CARD_GRID_ROW_GAP_PX,
  getProductCardCartMeasurementKey,
  getProductCardGridColumns,
  getProductCardGridRowEstimate,
  getProductCardGridRowMinHeight,
  getProductCardGridStyle,
} from "./product-card-layout";

interface UseProductCardVirtualGridLayoutInput {
  isDetailed: boolean;
  listWidth: number;
  quantityByProductId: Readonly<Record<string, number>>;
  shouldUseCartUi: boolean;
}

export function useProductCardVirtualGridLayout({
  isDetailed,
  listWidth,
  quantityByProductId,
  shouldUseCartUi,
}: UseProductCardVirtualGridLayoutInput) {
  const columns = React.useMemo(
    () => getProductCardGridColumns({ isDetailed, listWidth }),
    [isDetailed, listWidth],
  );
  const productRowEstimateSize = React.useMemo(() => {
    if (isDetailed) {
      return PRODUCT_CARD_DETAILED_ROW_ESTIMATE_PX;
    }

    return getProductCardGridRowEstimate({ columns, listWidth });
  }, [columns, isDetailed, listWidth]);
  const productRowMinHeight = React.useMemo(
    () => getProductCardGridRowMinHeight(isDetailed),
    [isDetailed],
  );
  const gridStyle = React.useMemo(
    () => getProductCardGridStyle(columns),
    [columns],
  );
  const cartMeasurementKey = React.useMemo(
    () =>
      getProductCardCartMeasurementKey({
        quantityByProductId,
        shouldUseCartUi,
      }),
    [quantityByProductId, shouldUseCartUi],
  );

  return React.useMemo(
    () => ({
      cartMeasurementKey,
      columns,
      gridStyle,
      productRowEstimateSize,
      productRowMinHeight,
      rowGap: PRODUCT_CARD_GRID_ROW_GAP_PX,
    }),
    [
      cartMeasurementKey,
      columns,
      gridStyle,
      productRowEstimateSize,
      productRowMinHeight,
    ],
  );
}
