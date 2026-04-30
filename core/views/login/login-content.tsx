"use client";

import {
  AuthUserDtoRole,
  useCatalogAuthControllerLogin,
} from "@/shared/api/generated/react-query";
import { setCatalogId } from "@/shared/api/client-request";
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
import { useRouter } from "next/navigation";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface Props {
  className?: string;
}

type LoginFormValues = {
  login: string;
  password: string;
};

export const LoginContent: React.FC<Props> = ({ className }) => {
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    defaultValues: {
      login: "",
      password: "",
    },
  });

  const loginMutation = useCatalogAuthControllerLogin();

  const onSubmit = form.handleSubmit(async (data: LoginFormValues) => {
    const payload = {
      login: data.login.trim(),
      password: data.password,
    };

    const loginPromise = (async () => {
      const result = await loginMutation.mutateAsync({ data: payload });

      if (result.user.role === AuthUserDtoRole.CATALOG && result.catalogId) {
        setCatalogId(result.catalogId);
      }

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
                    rules={{
                      required: "Введите логин",
                      validate: (value) => {
                        const normalizedValue = value.trim();

                        if (normalizedValue.length < 3) {
                          return "Минимум 3 символа";
                        }

                        if (normalizedValue.length > 50) {
                          return "Максимум 50 символов";
                        }

                        return true;
                      },
                    }}
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
                    rules={{
                      required: "Введите пароль",
                      minLength: {
                        value: 6,
                        message: "Минимум 6 символов",
                      },
                      maxLength: {
                        value: 50,
                        message: "Максимум 50 символов",
                      },
                    }}
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
