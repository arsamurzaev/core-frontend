import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

const adminPanelVariants = cva("rounded-panel border text-text-primary", {
  variants: {
    elevation: {
      none: "",
      surface: "shadow-surface",
    },
    padding: {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    },
    variant: {
      default: "border-line-subtle bg-surface-raised",
      muted: "border-line-subtle bg-surface-subtle",
      translucent: "border-line-subtle bg-surface-raised/70",
      dashed:
        "border-dashed border-line-subtle bg-surface-subtle text-text-muted",
    },
  },
  defaultVariants: {
    elevation: "none",
    padding: "md",
    variant: "default",
  },
});

export interface AdminPanelProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof adminPanelVariants> {}

const AdminPanel = React.forwardRef<HTMLDivElement, AdminPanelProps>(
  ({ className, elevation, padding, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        adminPanelVariants({ elevation, padding, variant }),
        className,
      )}
      {...props}
    />
  ),
);
AdminPanel.displayName = "AdminPanel";

export { AdminPanel, adminPanelVariants };
