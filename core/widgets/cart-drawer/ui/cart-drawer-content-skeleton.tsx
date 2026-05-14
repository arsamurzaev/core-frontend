"use client";

import { Skeleton } from "@/shared/ui/skeleton";
import React from "react";

const CART_DRAWER_SKELETON_ITEMS_COUNT = 3;

export const CartDrawerContentSkeleton: React.FC = () => {
  return (
    <>
      <ul className="space-y-4" aria-hidden>
        {Array.from(
          { length: CART_DRAWER_SKELETON_ITEMS_COUNT },
          (_, index) => (
            <li key={index}>
              <div className="shadow-custom relative grid grid-flow-col grid-cols-[auto_1fr] items-center gap-2 overflow-hidden rounded-lg pl-0 sm:grid-cols-[auto_1fr]">
                <Skeleton className="aspect-[3/4] h-25 rounded-none sm:h-[150px]" />
                <div className="flex h-full items-center p-2 pl-0">
                  <div className="flex h-full flex-1 flex-col justify-between space-y-2 py-1">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-11/12" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-26 rounded-full" />
                </div>
              </div>
            </li>
          ),
        )}
      </ul>

      <div className="space-y-3" aria-hidden>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      <div className="space-y-3" aria-hidden>
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-[100px] w-full rounded-lg" />
      </div>
    </>
  );
};
