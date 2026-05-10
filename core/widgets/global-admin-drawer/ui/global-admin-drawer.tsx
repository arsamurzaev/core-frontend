"use client";

import { invalidateProductQueries } from "@/core/modules/product/actions/model";
import {
  getBrandControllerGetAllQueryKey,
  getCatalogControllerGetCurrentQueryKey,
  getCategoryControllerGetAllQueryKey,
  getProductControllerGetAllQueryKey,
  type AdminDeleteCatalogContentResultDto,
  useAdminControllerDeleteCatalogContent,
} from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Button } from "@/shared/ui/button";
import { ConfirmationDrawer } from "@/shared/ui/confirmation-drawer";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, DatabaseZap, ShieldAlert, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

type GlobalAdminDrawerProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

const COUNT_LABELS: Array<{
  key: keyof AdminDeleteCatalogContentResultDto["counts"];
  label: string;
}> = [
  { key: "products", label: "Товары" },
  { key: "productVariants", label: "Варианты" },
  { key: "productAttributes", label: "Атрибуты товаров" },
  { key: "variantAttributes", label: "Атрибуты вариантов" },
  { key: "categories", label: "Категории" },
  { key: "brands", label: "Бренды" },
  { key: "seoSettings", label: "SEO контента" },
  { key: "productMediaLinks", label: "Связи с медиа" },
  { key: "categoryProductLinks", label: "Связи категорий" },
  { key: "integrationProductLinks", label: "Связи товаров интеграций" },
  { key: "integrationCategoryLinks", label: "Связи категорий интеграций" },
];

function getDeletedTotal(result: AdminDeleteCatalogContentResultDto): number {
  return Object.values(result.counts).reduce((sum, value) => sum + value, 0);
}

async function invalidateCatalogContentQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.allSettled([
    queryClient.invalidateQueries({
      queryKey: getCatalogControllerGetCurrentQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getCategoryControllerGetAllQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getBrandControllerGetAllQueryKey(),
    }),
    queryClient.invalidateQueries({
      queryKey: getProductControllerGetAllQueryKey(),
    }),
    invalidateProductQueries(queryClient),
  ]);
}

export const GlobalAdminDrawer: React.FC<GlobalAdminDrawerProps> = ({
  open,
  onOpenChange,
  trigger,
}) => {
  const catalog = useCatalog();
  const queryClient = useQueryClient();
  const deleteContent = useAdminControllerDeleteCatalogContent();
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [lastResult, setLastResult] =
    React.useState<AdminDeleteCatalogContentResultDto | null>(null);

  const isDeleting = deleteContent.isPending;

  const handleDeleteContent = React.useCallback(async () => {
    const result = await deleteContent.mutateAsync({ id: catalog.id });
    setLastResult(result);
    await invalidateCatalogContentQueries(queryClient);
    toast.success("Контент каталога отправлен в soft delete");
  }, [catalog.id, deleteContent, queryClient]);

  const resolvedTrigger =
    trigger === undefined ? (
      <Button type="button" size="sm" variant="outline">
        <ShieldAlert className="size-4" />
        Глобальный админ
      </Button>
    ) : (
      trigger
    );

  return (
    <>
      <AppDrawer
        open={open}
        onOpenChange={onOpenChange}
        dismissible={!isDeleting}
        trigger={resolvedTrigger}
      >
        <AppDrawer.Content className="w-full">
          <div className="flex min-h-0 flex-1 flex-col">
            <AppDrawer.Header
              title="Глобальное администрирование"
              withCloseButton={!isDeleting}
            />
            <hr />

            <DrawerScrollArea className="px-5 py-5">
              <div className="space-y-4">
                <section className="space-y-3 rounded-lg border border-black/10 p-4">
                  <div className="flex items-center gap-2">
                    <DatabaseZap className="size-5 text-primary" />
                    <h3 className="text-base font-semibold">
                      Текущий каталог
                    </h3>
                  </div>

                  <dl className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">Название</dt>
                    <dd className="min-w-0 break-words font-medium">
                      {catalog.name}
                    </dd>
                    <dt className="text-muted-foreground">Slug</dt>
                    <dd className="min-w-0 break-words font-mono text-xs">
                      {catalog.slug}
                    </dd>
                    <dt className="text-muted-foreground">ID</dt>
                    <dd className="min-w-0 break-all font-mono text-xs">
                      {catalog.id}
                    </dd>
                  </dl>
                </section>

                <section className="space-y-4 rounded-lg border border-destructive/35 bg-destructive/5 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-base font-semibold text-destructive">
                        Очистка контента
                      </h3>
                      <p className="text-sm leading-5 text-muted-foreground">
                        Будут скрыты товары, категории, бренды, SEO контента и
                        технические связи. Профиль каталога, настройки, заказы,
                        корзины и оплаты останутся на месте.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="full"
                    disabled={isDeleting}
                    onClick={() => setIsConfirmOpen(true)}
                  >
                    <Trash2 className="size-4" />
                    Удалить контент каталога
                  </Button>
                </section>

                {lastResult ? (
                  <section className="space-y-3 rounded-lg border border-black/10 p-4">
                    <div>
                      <h3 className="text-base font-semibold">
                        Последняя очистка
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Затронуто строк: {getDeletedTotal(lastResult)}
                      </p>
                    </div>

                    <div className="grid gap-2 text-sm">
                      {COUNT_LABELS.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="text-muted-foreground">
                            {item.label}
                          </span>
                          <span className="font-medium">
                            {lastResult.counts[item.key]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            </DrawerScrollArea>
          </div>
        </AppDrawer.Content>
      </AppDrawer>

      <ConfirmationDrawer
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Удалить контент каталога?"
        description={`Каталог "${catalog.name}" останется, но его товары, категории и бренды будут отправлены в soft delete.`}
        confirmText="Удалить контент"
        cancelText="Отмена"
        pendingText="Удаление..."
        confirmVariant="destructive"
        preventCloseWhilePending
        onConfirm={handleDeleteContent}
        onError={(error) => {
          toast.error(extractApiErrorMessage(error));
        }}
      />
    </>
  );
};
