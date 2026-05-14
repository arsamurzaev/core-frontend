"use client";

import { invalidateProductQueries } from "@/core/modules/product/actions/model";
import {
  CATALOG_FEATURE_LABELS,
  CATALOG_FEATURES,
  type CatalogFeature,
  getCatalogFeatureEntitlements,
  updateCatalogFeatureEntitlement,
} from "@/core/widgets/global-admin-drawer/model/catalog-feature-entitlements";
import {
  getBrandControllerGetAllQueryKey,
  getCatalogControllerGetCurrentFeaturesQueryKey,
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
import { Skeleton } from "@/shared/ui/skeleton";
import { Switch } from "@/shared/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  DatabaseZap,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
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

function getAdminCatalogFeaturesQueryKey(catalogId: string) {
  return ["admin", "catalog-features", catalogId] as const;
}

export const GlobalAdminDrawer: React.FC<GlobalAdminDrawerProps> = ({
  open,
  onOpenChange,
  trigger,
}) => {
  const catalog = useCatalog();
  const queryClient = useQueryClient();
  const deleteContent = useAdminControllerDeleteCatalogContent();
  const featureQuery = useQuery({
    queryKey: getAdminCatalogFeaturesQueryKey(catalog.id),
    queryFn: () => getCatalogFeatureEntitlements(catalog.id),
    staleTime: 30_000,
  });
  const updateFeature = useMutation({
    mutationFn: (params: { feature: CatalogFeature; enabled: boolean }) =>
      updateCatalogFeatureEntitlement(catalog.id, {
        ...params,
        metadata: { source: "global_admin_drawer" },
      }),
    onSuccess: async () => {
      await Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: getAdminCatalogFeaturesQueryKey(catalog.id),
        }),
        queryClient.invalidateQueries({
          queryKey: getCatalogControllerGetCurrentFeaturesQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: getCatalogControllerGetCurrentQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: ["/admin/catalogs"],
        }),
      ]);
    },
  });
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [lastResult, setLastResult] =
    React.useState<AdminDeleteCatalogContentResultDto | null>(null);

  const isDeleting = deleteContent.isPending;
  const featuresByKey = React.useMemo(() => {
    return new Map(
      (featureQuery.data?.features ?? []).map((feature) => [
        feature.feature,
        feature,
      ]),
    );
  }, [featureQuery.data?.features]);
  const capabilityItemsByKey = React.useMemo(() => {
    return new Map(
      (featureQuery.data?.items ?? []).map((item) => [item.key, item]),
    );
  }, [featureQuery.data?.items]);
  const capabilityDefinitionsByKey = React.useMemo(() => {
    return new Map(
      (featureQuery.data?.definitions ?? []).map((definition) => [
        definition.key,
        definition,
      ]),
    );
  }, [featureQuery.data?.definitions]);
  const pendingFeature = updateFeature.variables?.feature ?? null;

  const handleFeatureToggle = React.useCallback(
    (feature: CatalogFeature, enabled: boolean) => {
      toast.promise(updateFeature.mutateAsync({ feature, enabled }), {
        loading: enabled ? "Включаем функцию..." : "Выключаем функцию...",
        success: enabled ? "Функция включена" : "Функция выключена",
        error: (error) => extractApiErrorMessage(error),
      });
    },
    [updateFeature],
  );

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

                <section className="space-y-4 rounded-lg border border-black/10 p-4">
                  <div className="flex items-start gap-3">
                    <SlidersHorizontal className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-base font-semibold">
                        Beta-функции каталога
                      </h3>
                      <p className="text-sm leading-5 text-muted-foreground">
                        Включайте новые возможности точечно. Если флаг
                        выключен, данные не удаляются, но интерфейс и backend
                        не дают использовать эту функцию.
                      </p>
                    </div>
                  </div>

                  {featureQuery.isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                    </div>
                  ) : featureQuery.isError ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                      {extractApiErrorMessage(featureQuery.error)}
                    </div>
                  ) : (
                    <div className="divide-y divide-black/10 rounded-md border border-black/10">
                      {CATALOG_FEATURES.map((feature) => {
                        const entitlement = featuresByKey.get(feature);
                        const state = capabilityItemsByKey.get(feature);
                        const definition = capabilityDefinitionsByKey.get(feature);
                        const copy = {
                          title:
                            definition?.title ?? CATALOG_FEATURE_LABELS[feature].title,
                          description:
                            definition?.description ??
                            CATALOG_FEATURE_LABELS[feature].description,
                        };
                        const isPending =
                          updateFeature.isPending && pendingFeature === feature;

                        return (
                          <div
                            key={feature}
                            className="flex items-center justify-between gap-4 p-3"
                          >
                            <div className="min-w-0 space-y-1">
                              <div className="font-medium">{copy.title}</div>
                              <div className="text-sm leading-5 text-muted-foreground">
                                {copy.description}
                              </div>
                              {entitlement?.expiresAt ? (
                                <div className="text-xs text-muted-foreground">
                                  До {new Date(entitlement.expiresAt).toLocaleDateString("ru-RU")}
                                </div>
                              ) : null}
                              {state?.raw && !state.effective ? (
                                <div className="text-xs text-destructive">
                                  Недоступно: {state.disabledReason ?? "проверьте зависимости"}
                                </div>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {state?.effective ? "доступно" : "выкл"}
                              </span>
                            <Switch
                              checked={Boolean(entitlement?.enabled)}
                              disabled={updateFeature.isPending}
                              aria-label={copy.title}
                              onCheckedChange={(checked) =>
                                handleFeatureToggle(feature, checked)
                              }
                            />
                            {isPending ? (
                              <span className="sr-only">Сохраняем</span>
                            ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
