"use client";
import { useCatalogAuthControllerLogin } from "@/shared/api/generated";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { KreatiLogo } from "@/shared/ui/icons/kreati-logo";
import { Input } from "@/shared/ui/input";
import { ContentContainer } from "@/shared/ui/layout/content-container";
import React, { useRef } from "react";

interface Props {
  className?: string;
}

export const AuthFormCell: React.FC<Props> = ({ className }) => {
  const loginRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const loginMutation = useCatalogAuthControllerLogin();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const login = loginRef.current?.value;
    const password = passwordRef.current?.value;

    if (!login || !password) return;

    await loginMutation.mutateAsync({ data: { login, password } });
  };

  return (
    <ContentContainer className={cn("px-5", className)}>
      <form
        onSubmit={handleSubmit}
        className="flex min-h-svh flex-col justify-between"
      >
        <div className="flex flex-1 items-center justify-center text-center">
          <div className="flex-1 space-y-[60px]">
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
              <div className="space-y-[30px]">
                <Input
                  ref={loginRef}
                  required
                  placeholder="Логин"
                  className="rounded-full text-center"
                />
                <Input
                  ref={passwordRef}
                  required
                  placeholder="Пароль"
                  className="rounded-full text-center"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-8 pb-8">
          <Button size={"full"}>Войти</Button>
        </div>
      </form>
    </ContentContainer>
  );
};
