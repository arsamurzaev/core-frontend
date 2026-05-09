"use client";

import {
  useCatalogAdvancedSettingsControllerChangePassword,
} from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { FieldError } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { ChevronRight } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface EditCatalogPasswordDrawerProps {
  disabled?: boolean;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 25;
const initialValues: PasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function validatePasswordForm(values: PasswordFormValues): string | null {
  if (!values.currentPassword || !values.newPassword || !values.confirmPassword) {
    return "Заполните все поля.";
  }

  if (
    values.currentPassword.length < PASSWORD_MIN_LENGTH ||
    values.newPassword.length < PASSWORD_MIN_LENGTH
  ) {
    return `Пароль должен быть не короче ${PASSWORD_MIN_LENGTH} символов.`;
  }

  if (
    values.currentPassword.length > PASSWORD_MAX_LENGTH ||
    values.newPassword.length > PASSWORD_MAX_LENGTH
  ) {
    return `Пароль не должен превышать ${PASSWORD_MAX_LENGTH} символов.`;
  }

  if (values.newPassword !== values.confirmPassword) {
    return "Новый пароль и повтор не совпадают.";
  }

  if (values.currentPassword === values.newPassword) {
    return "Новый пароль должен отличаться от текущего.";
  }

  return null;
}

export const EditCatalogPasswordDrawer: React.FC<
  EditCatalogPasswordDrawerProps
> = ({ disabled = false }) => {
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState<PasswordFormValues>(initialValues);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const changePassword = useCatalogAdvancedSettingsControllerChangePassword();
  const isPending = changePassword.isPending;

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setValues(initialValues);
      setErrorMessage(null);
    }
  }, []);

  const setField = React.useCallback(
    (field: keyof PasswordFormValues, value: string) => {
      setValues((currentValues) => ({
        ...currentValues,
        [field]: value,
      }));
      setErrorMessage(null);
    },
    [],
  );

  const handleSubmit = React.useCallback(async () => {
    const validationError = validatePasswordForm(values);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      await changePassword.mutateAsync({
        data: {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
      });

      toast.success("Пароль для каталога изменён.");
      handleOpenChange(false);
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setErrorMessage(message);
      toast.error(message);
    }
  }, [changePassword, handleOpenChange, values]);

  const handleFormSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void handleSubmit();
    },
    [handleSubmit],
  );

  return (
    <AppDrawer
      nested
      open={open}
      onOpenChange={handleOpenChange}
      dismissible={!isPending}
      trigger={
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full min-w-0 items-start justify-between rounded-2xl border border-black/10 px-4 py-4 text-left whitespace-normal hover:bg-muted/30"
          disabled={disabled}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                Пароль
              </span>
              <Badge variant="secondary">Безопасность</Badge>
            </div>
            <p className="mt-1 break-words text-sm text-muted-foreground whitespace-normal">
              Обновите пароль для входа в настройки текущего каталога.
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      }
    >
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Смена пароля"
            description="Введите текущий пароль и задайте новый пароль для доступа к настройкам каталога."
            withCloseButton={!isPending}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            <form
              id="catalog-password-form"
              className="space-y-4"
              autoComplete="on"
              onSubmit={handleFormSubmit}
            >
              <input
                type="text"
                name="username"
                autoComplete="username"
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
              />
              <div className="space-y-2">
                <Label htmlFor="catalog-current-password">Текущий пароль</Label>
                <Input
                  id="catalog-current-password"
                  name="current-password"
                  type="password"
                  value={values.currentPassword}
                  minLength={PASSWORD_MIN_LENGTH}
                  maxLength={PASSWORD_MAX_LENGTH}
                  autoComplete="current-password"
                  disabled={isPending}
                  placeholder="Введите текущий пароль"
                  onChange={(event) =>
                    setField("currentPassword", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="catalog-new-password">Новый пароль</Label>
                <Input
                  id="catalog-new-password"
                  name="new-password"
                  type="password"
                  value={values.newPassword}
                  minLength={PASSWORD_MIN_LENGTH}
                  maxLength={PASSWORD_MAX_LENGTH}
                  autoComplete="new-password"
                  disabled={isPending}
                  placeholder="От 8 до 25 символов"
                  onChange={(event) =>
                    setField("newPassword", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="catalog-confirm-password">Повтор пароля</Label>
                <Input
                  id="catalog-confirm-password"
                  name="confirm-password"
                  type="password"
                  value={values.confirmPassword}
                  minLength={PASSWORD_MIN_LENGTH}
                  maxLength={PASSWORD_MAX_LENGTH}
                  autoComplete="new-password"
                  disabled={isPending}
                  placeholder="Повторите новый пароль"
                  onChange={(event) =>
                    setField("confirmPassword", event.target.value)
                  }
                />
              </div>

              {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
            </form>
          </DrawerScrollArea>

          <AppDrawer.Footer
            className="border-t"
            isAutoClose={false}
            loading={isPending}
            btnText="Сохранить пароль"
            handleClick={() => {
              const form = document.getElementById("catalog-password-form");

              if (form instanceof HTMLFormElement) {
                form.requestSubmit();
              }
            }}
          />
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
