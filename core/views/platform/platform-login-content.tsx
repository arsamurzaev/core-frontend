"use client";

import {
  AuthUserDtoRole,
  useAuthControllerLogin,
} from "@/shared/api/generated/react-query";
import { setCatalogId } from "@/shared/api/client-request";
import { Button } from "@/shared/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { PlatformShell } from "./platform-shell";

type PlatformLoginFormValues = {
  login: string;
  password: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ошибка входа";
}

function navigateTo(url: string, router: ReturnType<typeof useRouter>) {
  if (/^https?:\/\//i.test(url)) {
    window.location.assign(url);
    return;
  }

  router.replace(url);
  router.refresh();
}

export function PlatformLoginContent() {
  const router = useRouter();
  const loginMutation = useAuthControllerLogin();
  const form = useForm<PlatformLoginFormValues>({
    mode: "onChange",
    defaultValues: {
      login: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const loginPromise = (async () => {
      const result = await loginMutation.mutateAsync({
        data: {
          login: values.login.trim(),
          password: values.password,
        },
      });

      if (result.user.role === AuthUserDtoRole.CATALOG && result.catalogId) {
        setCatalogId(result.catalogId);
      }

      navigateTo(result.redirectUrl ?? "/", router);
    })();

    await toast.promise(loginPromise, {
      loading: "Вход...",
      success: "Вход выполнен",
      error: getErrorMessage,
    });
  });

  return (
    <PlatformShell
      eyebrow="Вход"
      title="Войти в каталог"
      description="Введите логин каталога и пароль, отправленный на почту."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FieldGroup className="gap-5">
          <Controller
            name="login"
            control={form.control}
            rules={{
              required: "Введите логин",
              minLength: { value: 2, message: "Минимум 2 символа" },
              maxLength: { value: 63, message: "Максимум 63 символа" },
            }}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Логин</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  value={field.value ?? ""}
                  autoComplete="username"
                  aria-invalid={fieldState.invalid}
                  placeholder="flowers"
                  className="h-12"
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            rules={{
              required: "Введите пароль",
              minLength: { value: 6, message: "Минимум 6 символов" },
              maxLength: { value: 72, message: "Максимум 72 символа" },
            }}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Пароль</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="password"
                  value={field.value ?? ""}
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                  placeholder="Временный пароль"
                  className="h-12"
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldGroup>

        {form.formState.errors.root?.message ? (
          <FieldError>{form.formState.errors.root.message}</FieldError>
        ) : null}

        <Button
          type="submit"
          size="full"
          disabled={!form.formState.isValid || loginMutation.isPending}
        >
          <LogIn className="size-4" aria-hidden="true" />
          Войти
        </Button>
      </form>
    </PlatformShell>
  );
}
