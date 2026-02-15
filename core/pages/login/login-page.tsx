import { cn } from "@/shared/lib/utils";
import React from "react";

interface Props {
  className?: string;
}

export const LoginPage: React.FC<Props> = ({ className }) => {
  return (
    <div
      className={cn("size-full flex justify-center items-center", className)}
    ></div>
  );
};
