import React from "react";
import { cn } from "../../lib/utils";

interface Props {
  className?: string;
}

export const KreatiLogo: React.FC<Props> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-10.5 h-15.5", className)}
      viewBox="0 0 42 62"
      fill="none"
    >
      <path
        d="M0 62V42.0082H8.02388V33.5306H0V0H8.02388V33.5306L26.4537 16.702H36.7343L14.2925 37.2L42 62H30.3403L8.02388 42.0082V62H0Z"
        fill="currentColor"
      />
    </svg>
  );
};
