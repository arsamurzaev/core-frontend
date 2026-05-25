import React from "react";

import { cn } from "@/shared/lib/utils";

interface IikoIconProps {
  className?: string;
}

export const IikoIcon: React.FC<IikoIconProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={cn("size-5", className)}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="15" fill="#E31E24" />
      <path
        fill="#fff"
        d="M8.3 11.4a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Zm-1.5 12.5h3V13h-3v10.9Zm7.2-12.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Zm-1.5 12.5h3V13h-3v10.9Zm12.8-10.9h-3.7l-3.4 4.1V8.2h-3v15.7h3v-3.1l1-1.1 2.8 4.2h3.6l-4.3-6.3 4-4.6Z"
      />
    </svg>
  );
};
