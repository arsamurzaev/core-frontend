import { cn } from "@/shared/lib/utils";
import React, { PropsWithChildren } from "react";

interface Props {
  className?: string;
}

export const ContentContainer: React.FC<PropsWithChildren<Props>> = ({
  className,
  children,
}) => {
  return (
    <div className={cn("m-auto w-full max-w-180", className)}>{children}</div>
  );
};
