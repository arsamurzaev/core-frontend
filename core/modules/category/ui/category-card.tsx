import { CategoryDto } from "@/shared/api/generated";
import { cn } from "@/shared/lib/utils";
import React from "react";

interface Props {
  className?: string;
  data: CategoryDto;
  index: number;
  handleClick?: (id: string) => void;
  action?: (category: CategoryDto) => React.ReactNode;
}

export const CategoryCard: React.FC<Props> = ({
  className,
  index,
  data,
  handleClick,
  action,
}) => {
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
