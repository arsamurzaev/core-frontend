"use client";

import { useAuthControllerLogin } from "@/shared/api/generated";
import { AuthControllerLoginBody } from "@/shared/api/generated/zod";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/shared/ui/field";
import { KreatiLogo } from "@/shared/ui/icons/kreati-logo";
import { Input } from "@/shared/ui/input";
import { ContentContainer } from "@/shared/ui/layout/content-container";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

interface Props {
  className?: string;
}

const schema = AuthControllerLoginBody.extend({
  login: z
    .string({ error: "Логин должен быть строкой" })
    .min(3, { error: "Минимум 3 символа" })
    .max(50, { error: "Максимум 50 символов" }),
  password: z
    .string({ error: "Пароль должен быть строкой" })
    .min(6, { error: "Минимум 6 символов" })
    .max(50, { error: "Максимум 50 символов" }),
});

type LoginFormValues = z.infer<typeof schema>;

export const LoginContent: React.FC<Props> = ({ className }) => {
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      login: "",
      password: "",
    },
  });

  const loginMutation = useAuthControllerLogin();

  const onSubmit = form.handleSubmit(async (data: LoginFormValues) => {
    const loginPromise = (async () => {
      await loginMutation.mutateAsync({ data });
      router.replace("/");
      router.refresh();
    })();

    await toast.promise(loginPromise, {
      loading: "Вход...",
      success: "Вход выполнен",
      error: (err) => (err instanceof Error ? err.message : "Ошибка входа"),
    });
  });

  return (
    <ContentContainer className={cn("px-5", className)}>
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex min-h-svh flex-col justify-between"
      >
        <div className="flex flex-1 items-center justify-center text-center">
          <div className="flex-1 space-y-15">
            <div className="flex justify-center">
              <KreatiLogo />
            </div>
            <div className="space-y-12">
              <div className="space-y-1.5">
                <h1 className="text-3xl font-semibold">Добро пожаловать!</h1>
                <p className="text-lg font-light">
                  вход в административную панель
                </p>
              </div>

              <FieldSet className="gap-7.5">
                <FieldGroup className="gap-7.5">
                  <Controller
                    name="login"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name} className="sr-only">
                          Логин
                        </FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          value={field.value ?? ""}
                          autoComplete="username"
                          aria-invalid={fieldState.invalid}
                          placeholder="Логин"
                          className="h-12.5 rounded-full text-center"
                        />
                        {fieldState.invalid && (
                          <FieldError
                            errors={[fieldState.error]}
                            className="text-center"
                          />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="password"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name} className="sr-only">
                          Пароль
                        </FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          value={field.value ?? ""}
                          autoComplete="current-password"
                          aria-invalid={fieldState.invalid}
                          placeholder="Пароль"
                          className="h-12.5 rounded-full text-center"
                        />
                        {fieldState.invalid && (
                          <FieldError
                            errors={[fieldState.error]}
                            className="text-center"
                          />
                        )}
                      </Field>
                    )}
                  />

                  {form.formState.errors.root?.message && (
                    <FieldError className="text-center">
                      {form.formState.errors.root.message}
                    </FieldError>
                  )}
                </FieldGroup>
              </FieldSet>
            </div>
          </div>
        </div>

        <div className="space-y-8 pb-8">
          <Button
            size="full"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            Войти
          </Button>
        </div>
      </form>
    </ContentContainer>
  );
};
