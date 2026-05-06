import { Button } from "@/shared/ui/button";
import { Home, SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-background flex min-h-svh items-center justify-center px-5 py-10">
      <section className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-6 flex size-14 items-center justify-center rounded-full border bg-secondary text-foreground">
          <SearchX className="size-7" aria-hidden="true" />
        </div>
        <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">
          404
        </p>
        <h1 className="text-3xl leading-tight font-bold">Каталог не найден</h1>
        <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-500">
          Возможно, каталог был удален, домен еще не подключен или в ссылке есть
          ошибка.
        </p>
        <Button className="mt-7" asChild>
          <Link href="/">
            <Home className="size-4" aria-hidden="true" />
            На главную
          </Link>
        </Button>
      </section>
    </main>
  );
}
