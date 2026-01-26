// app/error.tsx
"use client";

import { Button } from "@/shared/ui/button";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Логирование в систему мониторинга
    console.error("[GlobalError]", error);
    // sendToErrorTracking(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Что-то пошло не так</h1>
      <p className="text-muted-foreground">Произошла непредвиденная ошибка</p>
      <Button onClick={reset}>Попробовать снова</Button>
    </div>
  );
}
