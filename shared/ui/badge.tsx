import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center leading-none font-light px-1 text-xs transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-status-info text-status-info-foreground shadow hover:bg-status-info/80",
        secondary:
          "bg-surface-raised text-action-secondary-foreground hover:bg-surface-muted/80",
        destructive:
          "bg-status-danger text-status-danger-foreground shadow hover:bg-status-danger/80",
        outline: "text-text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

