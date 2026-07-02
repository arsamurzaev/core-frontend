"use client";

import { setCatalogId } from "@/shared/api/client-request";
import { useCatalogOnboardingControllerConfirm } from "@/shared/api/generated/react-query";
import { Button } from "@/shared/ui/button";
import { FieldError } from "@/shared/ui/field";
import { CheckCircle2, Loader2, LogIn, RefreshCw } from "lucide-react";
import Link from "next/link";
import React from "react";
import { PlatformShell } from "./platform-shell";

type PlatformVerifyEmailContentProps = {
  token: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Не удалось подтвердить почту";
}

export function PlatformVerifyEmailContent({
  token,
}: PlatformVerifyEmailContentProps) {
  const confirmMutation = useCatalogOnboardingControllerConfirm();
  const { mutate } = confirmMutation;
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (!token || startedRef.current) {
      return;
    }

    startedRef.current = true;
    mutate(
      { data: { token } },
      {
        onSuccess: (result) => {
          setCatalogId(result.catalogId);
        },
      },
    );
  }, [mutate, token]);

  if (!token) {
    return (
      <PlatformShell
        eyebrow="Подтверждение"
        title="Ссылка некорректна"
        description="В письме должна быть ссылка с токеном подтверждения."
      >
        <Button asChild size="full">
          <Link href="https://register.myctlg.ru">Вернуться к регистрации</Link>
        </Button>
      </PlatformShell>
    );
  }

  if (confirmMutation.isPending || confirmMutation.isIdle) {
    return (
      <PlatformShell
        eyebrow="Подтверждение"
        title="Подтверждаем аккаунт"
        description="Это займет несколько секунд."
      >
        <div className="flex items-center justify-center py-8 text-text-muted">
          <Loader2 className="size-7 animate-spin" aria-hidden="true" />
        </div>
      </PlatformShell>
    );
  }

  if (confirmMutation.isError) {
    return (
      <PlatformShell
        eyebrow="Подтверждение"
        title="Не удалось подтвердить аккаунт"
        description="Ссылка могла устареть или уже использоваться."
      >
        <div className="space-y-5">
          <FieldError>{getErrorMessage(confirmMutation.error)}</FieldError>
          <Button
            type="button"
            size="full"
            onClick={() => {
              startedRef.current = true;
              mutate(
                { data: { token } },
                {
                  onSuccess: (result) => {
                    setCatalogId(result.catalogId);
                  },
                },
              );
            }}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Повторить
          </Button>
        </div>
      </PlatformShell>
    );
  }

  const result = confirmMutation.data;

  return (
    <PlatformShell
      eyebrow="Готово"
      title="Аккаунт подтвержден"
      description={
        result?.accessEmailSent
          ? result.message
          : "Аккаунт подтвержден, но письмо с доступом не отправилось. Обратитесь в поддержку."
      }
    >
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-pill bg-status-success-surface text-status-success">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </div>

        {result ? (
          <div className="rounded-panel border border-line-subtle bg-surface-subtle p-4 text-left text-sm leading-6 text-text-muted">
            <div>
              <span className="text-text-muted">Каталог:</span>{" "}
              <a
                href={result.catalogUrl}
                className="font-medium text-text-primary underline underline-offset-4"
              >
                {result.catalogUrl}
              </a>
            </div>
            <div>
              <span className="text-text-muted">Вход:</span>{" "}
              <a
                href={result.loginUrl}
                className="font-medium text-text-primary underline underline-offset-4"
              >
                {result.loginUrl}
              </a>
            </div>
          </div>
        ) : null}

        <Button asChild size="full">
          <a href={result?.loginUrl ?? "https://login.myctlg.ru"}>
            <LogIn className="size-4" aria-hidden="true" />
            Перейти ко входу
          </a>
        </Button>
      </div>
    </PlatformShell>
  );
}
