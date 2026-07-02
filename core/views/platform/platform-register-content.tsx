"use client";

import {
  type CatalogOnboardingSignupDtoReq,
  type TypeDto,
  useCatalogOnboardingControllerCheckSystemDomain,
  useCatalogOnboardingControllerResend,
  useCatalogOnboardingControllerSignup,
  useTypeControllerGetAll,
} from "@/shared/api/generated/react-query";
import { Button } from "@/shared/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { PhoneInput } from "@/shared/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
} from "lucide-react";
import React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { PlatformShell } from "./platform-shell";

const SLUG_PATTERN = /^[a-z0-9-]+$/;
const DEBOUNCE_MS = 450;

type RegisterFormValues = CatalogOnboardingSignupDtoReq;

type SignupDoneState = {
  email: string;
  fqdn: string;
  expiresAt: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Не удалось выполнить запрос";
}

function normalizeSlugInput(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 63);
}

function getPhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
}

function getTypeLabel(type: TypeDto): string {
  return type.name || type.code || "Тип бизнеса";
}

function isActiveType(type: TypeDto): boolean {
  return !type.deleteAt;
}

function DomainStatus({
  slug,
  isChecking,
  isValid,
  fqdn,
  available,
  reason,
  error,
}: {
  slug: string;
  isChecking: boolean;
  isValid: boolean;
  fqdn?: string | null;
  available?: boolean;
  reason?: string | null;
  error?: unknown;
}) {
  if (!slug) {
    return null;
  }

  if (!isValid) {
    return (
      <p className="text-sm text-text-muted">
        Домен должен быть от 2 до 63 символов: латиница, цифры и дефис.
      </p>
    );
  }

  if (isChecking) {
    return (
      <p className="inline-flex items-center gap-2 text-sm text-text-muted">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        Проверяем домен
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-status-danger">{getErrorMessage(error)}</p>
    );
  }

  if (available) {
    return (
      <p className="inline-flex items-center gap-2 text-sm text-status-success">
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        Свободен: {fqdn}
      </p>
    );
  }

  if (available === false) {
    return (
      <p className="text-sm text-status-danger">{reason ?? "Домен занят"}</p>
    );
  }

  return null;
}

function SignupDone({
  state,
  onResend,
  isResending,
}: {
  state: SignupDoneState;
  onResend: () => Promise<void>;
  isResending: boolean;
}) {
  return (
    <PlatformShell
      eyebrow="Почта"
      title="Проверьте почту"
      description={`Мы отправили ссылку подтверждения на ${state.email}. После подтверждения каталог ${state.fqdn} будет создан автоматически.`}
    >
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-pill bg-status-success-surface text-status-success">
          <Mail className="size-6" aria-hidden="true" />
        </div>

        <p className="text-sm leading-6 text-text-muted">
          Ссылка действует до{" "}
          {new Intl.DateTimeFormat("ru-RU", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(state.expiresAt))}
          .
        </p>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => void onResend()}
          disabled={isResending}
        >
          {isResending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="size-4" aria-hidden="true" />
          )}
          Отправить еще раз
        </Button>
      </div>
    </PlatformShell>
  );
}

export function PlatformRegisterContent() {
  const [signupDone, setSignupDone] = React.useState<SignupDoneState | null>(
    null,
  );
  const form = useForm<RegisterFormValues>({
    mode: "onChange",
    defaultValues: {
      catalogName: "",
      slug: "",
      typeId: "",
      fullName: "",
      phone: "",
      email: "",
    },
  });
  const typesQuery = useTypeControllerGetAll({
    query: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  });
  const signupMutation = useCatalogOnboardingControllerSignup();
  const resendMutation = useCatalogOnboardingControllerResend();
  const slug = useWatch({ control: form.control, name: "slug" }) ?? "";
  const debouncedSlug = useDebouncedValue(slug, DEBOUNCE_MS);
  const slugIsValid =
    slug.length >= 2 && slug.length <= 63 && SLUG_PATTERN.test(slug);
  const canCheckSlug = slugIsValid && debouncedSlug === slug;
  const domainQuery = useCatalogOnboardingControllerCheckSystemDomain(
    { slug: debouncedSlug || "na" },
    {
      query: {
        enabled: canCheckSlug,
        retry: false,
        staleTime: 10_000,
      },
    },
  );
  const domainData =
    domainQuery.data?.slug === slug ? domainQuery.data : undefined;
  const domainReady = Boolean(domainData?.available);
  const types = React.useMemo(
    () => (typesQuery.data ?? []).filter(isActiveType),
    [typesQuery.data],
  );

  React.useEffect(() => {
    if (!form.getValues("typeId") && types[0]?.id) {
      form.setValue("typeId", types[0].id, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    }
  }, [form, types]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!domainReady) {
      form.setError("slug", {
        message: "Дождитесь проверки свободного домена",
      });
      return;
    }

    const payload: RegisterFormValues = {
      catalogName: values.catalogName.trim(),
      slug: values.slug.trim(),
      typeId: values.typeId,
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      email: values.email.trim().toLowerCase(),
    };

    try {
      const result = await signupMutation.mutateAsync({ data: payload });
      setSignupDone({
        email: result.email,
        fqdn: result.fqdn,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      form.setError("root", { message: getErrorMessage(error) });
    }
  });

  const resend = async () => {
    if (!signupDone?.email) return;

    await toast.promise(
      resendMutation.mutateAsync({ data: { email: signupDone.email } }),
      {
        loading: "Отправляем письмо...",
        success: "Письмо отправлено",
        error: getErrorMessage,
      },
    );
  };

  if (signupDone) {
    return (
      <SignupDone
        state={signupDone}
        onResend={resend}
        isResending={resendMutation.isPending}
      />
    );
  }

  return (
    <PlatformShell
      eyebrow="Регистрация"
      title="Создать каталог"
      description="Заполните данные бизнеса и владельца. Ссылку подтверждения отправим на указанную почту."
      footer={
        <a
          className="underline underline-offset-4"
          href="https://login.myctlg.ru"
        >
          Войти
        </a>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <FieldGroup className="gap-5">
          <Controller
            name="catalogName"
            control={form.control}
            rules={{
              required: "Введите название бизнеса",
              minLength: { value: 2, message: "Минимум 2 символа" },
              maxLength: { value: 255, message: "Максимум 255 символов" },
            }}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Название бизнеса</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  value={field.value ?? ""}
                  placeholder="Flowers shop"
                  aria-invalid={fieldState.invalid}
                  className="h-12"
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="slug"
            control={form.control}
            rules={{
              required: "Введите домен",
              validate: (value) => {
                if (value.length < 2) return "Минимум 2 символа";
                if (value.length > 63) return "Максимум 63 символа";
                if (!SLUG_PATTERN.test(value)) {
                  return "Только латиница, цифры и дефис";
                }
                if (domainData?.available === false) {
                  return domainData.reason ?? "Домен занят";
                }
                return true;
              },
            }}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Домен</FieldLabel>
                <div className="flex items-center rounded-control border border-line-default shadow-control focus-within:ring-1 focus-within:ring-action-primary/50">
                  <Input
                    id={field.name}
                    value={field.value ?? ""}
                    onChange={(event) =>
                      field.onChange(normalizeSlugInput(event.target.value))
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    placeholder="flowers"
                    aria-invalid={fieldState.invalid}
                    className="h-12 rounded-none border-0 shadow-none focus-visible:ring-0 focus-visible:outline-none"
                  />
                  <span className="shrink-0 pr-4 text-sm text-text-muted">
                    .myctlg.ru
                  </span>
                </div>
                <DomainStatus
                  slug={slug}
                  isValid={slugIsValid}
                  isChecking={domainQuery.isFetching}
                  fqdn={domainData?.fqdn}
                  available={domainData?.available}
                  reason={domainData?.reason}
                  error={canCheckSlug ? domainQuery.error : null}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="typeId"
            control={form.control}
            rules={{ required: "Выберите тип бизнеса" }}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Тип бизнеса</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={typesQuery.isLoading || types.length === 0}
                >
                  <SelectTrigger id={field.name} className="h-12">
                    <SelectValue
                      placeholder={
                        typesQuery.isLoading ? "Загружаем..." : "Выберите тип"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {getTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {typesQuery.error ? (
                  <FieldError>{getErrorMessage(typesQuery.error)}</FieldError>
                ) : (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="fullName"
            control={form.control}
            rules={{
              required: "Введите ФИО",
              minLength: { value: 2, message: "Минимум 2 символа" },
              maxLength: { value: 255, message: "Максимум 255 символов" },
            }}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>ФИО</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  value={field.value ?? ""}
                  autoComplete="name"
                  placeholder="Иван Иванов"
                  aria-invalid={fieldState.invalid}
                  className="h-12"
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="phone"
            control={form.control}
            rules={{
              required: "Введите телефон",
              validate: (value) =>
                getPhoneDigits(value).length >= 5 ||
                "Введите корректный телефон",
            }}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Номер телефона для обратной связи
                </FieldLabel>
                <PhoneInput
                  id={field.name}
                  name={field.name}
                  ref={field.ref}
                  value={field.value ?? ""}
                  onBlur={field.onBlur}
                  onValueChange={field.onChange}
                  autoComplete="tel"
                  placeholder="+7 999 000-00-00"
                  aria-invalid={fieldState.invalid}
                  className="h-12"
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="email"
            control={form.control}
            rules={{
              required: "Введите почту",
              maxLength: { value: 320, message: "Максимум 320 символов" },
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Введите корректную почту",
              },
            }}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Почта</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  value={field.value ?? ""}
                  type="email"
                  autoComplete="email"
                  placeholder="owner@example.com"
                  aria-invalid={fieldState.invalid}
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
          disabled={
            !form.formState.isValid || !domainReady || signupMutation.isPending
          }
        >
          {signupMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight className="size-4" aria-hidden="true" />
          )}
          Далее
        </Button>
      </form>
    </PlatformShell>
  );
}
