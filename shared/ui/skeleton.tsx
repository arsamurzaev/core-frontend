import { cn } from "@/shared/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-surface-subtle animate-pulse rounded-control", className)}
      {...props}
    />
  );
}

export { Skeleton };
