import type { CategoryDto } from "@/shared/api/generated/react-query";
import type { CategoryCardVariant } from "@/core/modules/category/model/category-card";
import { cn } from "@/shared/lib/utils";
import React from "react";

export type { CategoryCardVariant } from "@/core/modules/category/model/category-card";

interface Props {
  className?: string;
  data: CategoryDto;
  index: number;
  handleClick?: (id: string) => void;
  action?: (category: CategoryDto) => React.ReactNode;
  variant?: CategoryCardVariant;
}

export const CategoryCard: React.FC<Props> = ({
  className,
  index,
  data,
  handleClick,
  action,
  variant = "default",
}) => {
  if (variant === "compact") {
    return (
      <article className="relative p-1">
        <div
          className="block h-full bg-transparent p-0"
          onClick={() => handleClick?.(data.id)}
        >
          <div
            className={cn(
              "shadow-custom flex min-h-16 w-full items-center rounded-lg border border-black/5 bg-white px-4 py-3 pr-12 text-black",
              className,
            )}
          >
            <h2 className="truncate text-base font-semibold sm:text-lg">
              {data.name}
            </h2>
          </div>
        </div>
        {action?.(data)}
      </article>
    );
  }

  return (
    <article className="relative p-1">
      <div
        className="block h-full bg-transparent p-0"
        onClick={() => handleClick?.(data.id)}
      >
        <div
          className={cn(
            "shadow-custom flex aspect-2/1 w-full flex-col items-start justify-end rounded-lg bg-cover px-6 py-5 text-white",
            className,
          )}
          style={{
            backgroundImage: `linear-gradient(15deg, rgba(0, 0, 0, 0.60) 25%, rgba(0, 0, 0, 0.00) 65%), url(${
              data.imageMedia?.url || `/texture/${index % 8}.png`
            })`,
          }}
        >
          <h2 className="text-3xl font-bold sm:text-5xl">{data.name}</h2>
          <p className="text-xs sm:text-lg">{data.descriptor}</p>
        </div>
      </div>
      {action?.(data)}
    </article>
  );
};
