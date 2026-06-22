import { cn } from "@/shared/lib/utils";
import { KreatiLogo } from "@/shared/ui/icons/kreati-logo";
import type React from "react";

type PlatformShellProps = React.PropsWithChildren<{
  className?: string;
  eyebrow: string;
  title: string;
  description?: string;
  footer?: React.ReactNode;
}>;

export function PlatformShell({
  children,
  className,
  eyebrow,
  title,
  description,
  footer,
}: PlatformShellProps) {
  return (
    <main className="bg-background min-h-svh px-5 py-6">
      <div className="mx-auto flex min-h-[calc(100svh-48px)] w-full max-w-5xl flex-col">
        <header className="flex items-center justify-between gap-4">
          <KreatiLogo />
          {footer ? (
            <div className="text-sm text-neutral-500">{footer}</div>
          ) : null}
        </header>

        <div className="flex flex-1 items-center justify-center py-8">
          <section className={cn("w-full max-w-xl", className)}>
            <div className="mb-7 space-y-2 text-center">
              <p className="text-xs font-medium tracking-[0.18em] text-neutral-500 uppercase">
                {eyebrow}
              </p>
              <h1 className="text-3xl leading-tight font-semibold text-neutral-950">
                {title}
              </h1>
              {description ? (
                <p className="mx-auto max-w-md text-sm leading-6 text-neutral-500">
                  {description}
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              {children}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
