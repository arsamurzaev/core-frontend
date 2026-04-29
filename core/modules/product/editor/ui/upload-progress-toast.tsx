"use client";

import { Progress } from "@/shared/ui/progress";

interface UploadProgressToastProps {
  label: string;
  progress: number;
}

export const UploadProgressToast: React.FC<UploadProgressToastProps> = ({
  label,
  progress,
}) => {
  const normalizedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="flex w-full min-w-64 flex-col gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="shrink-0 text-muted-foreground tabular-nums">
          {normalizedProgress}%
        </span>
      </div>
      <Progress value={normalizedProgress} />
    </div>
  );
};
