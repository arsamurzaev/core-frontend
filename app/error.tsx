"use client";

import { getUserFacingError } from "@/shared/lib/user-facing-error";
import { Button } from "@/shared/ui/button";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const userFacingError = getUserFacingError(error);
  const Icon = userFacingError.kind === "network" ? WifiOff : AlertTriangle;

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[GlobalError]", error);
    }
    // sendToErrorTracking(error);
  }, [error]);

  return (
    <main className="flex min-h-svh items-center justify-center bg-surface-base px-5 py-10 text-text-primary">
      <section className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-6 flex size-14 items-center justify-center rounded-pill border border-line-subtle bg-surface-muted text-text-primary">
          <Icon className="size-7" aria-hidden="true" />
        </div>
        <p className="mb-3 text-xs font-medium uppercase text-text-muted">
          Ошибка загрузки
        </p>
        <h1 className="text-3xl leading-tight font-bold">
          {userFacingError.title}
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-6 text-text-muted">
          {userFacingError.description}
        </p>
        <Button className="mt-7" onClick={reset}>
          <RefreshCw className="size-4" aria-hidden="true" />
          {userFacingError.actionLabel}
        </Button>
        {process.env.NODE_ENV === "development" ? (
          <p className="mt-5 max-w-sm break-words text-xs text-text-muted/70">
            {error.name}: {error.message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
