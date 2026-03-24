import React from "react";
import { cn } from "@/shared/lib/utils";

interface MoyskladIconProps {
  className?: string;
}

export const MoyskladIcon: React.FC<MoyskladIconProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 29 23"
      fill="none"
      className={cn("size-5", className)}
      aria-hidden="true"
    >
      <path
        fill="#64CDFF"
        fillRule="evenodd"
        d="M4.01 22.032c3.66 0 6.427-4.858 8.909-10.16 1.192-2.572 2.306-5.267 3.42-7.55C17.56 1.788 18.816 0 20.349 0c1.302 0 2.527 1.071 3.744 2.75 2.526 3.482 4.709 9.382 4.709 13.251 0 3.242-1.637 6.03-4.991 6.03z"
        clipRule="evenodd"
      />
      <path
        fill="#2855AF"
        fillRule="evenodd"
        d="M12.919 11.87c-2.514-5.166-3.652-8.957-5.877-8.957-1.38 0-2.936 1.477-4.346 3.898C1.186 9.38 0 13.004 0 16.904c0 3.08 1.478 5.127 4.01 5.127 3.661 0 6.429-4.857 8.909-10.16"
        clipRule="evenodd"
      />
    </svg>
  );
};
