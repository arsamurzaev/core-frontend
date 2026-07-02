"use client";

import {
  archiveCatalogPriceList,
  catalogPriceListQueryKeys,
  createCatalogPriceList,
  updateCatalogPriceList,
  useCatalogPriceLists,
  type CatalogPriceList,
} from "@/core/modules/catalog-price-list/model/catalog-price-list-api";
import { invalidateProductQueries } from "@/core/modules/product";
import { getCatalogControllerGetCurrentQueryKey } from "@/shared/api/generated/react-query";
import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { cn } from "@/shared/lib/utils";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { confirmDelete } from "@/shared/ui/confirmation";
import { DrawerScrollArea } from "@/shared/ui/drawer";
import { FieldError } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { Switch } from "@/shared/ui/switch";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core";
import {
  restrictToFirstScrollableAncestor,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronRight,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import React from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

type PriceListDraft = {
  isActive: boolean;
  name: string;
};

const emptyCreateDraft: PriceListDraft = {
  isActive: true,
  name: "",
};

interface ProductPriceListSettingsDrawerProps {
  children?: React.ReactNode;
  disabled?: boolean;
  nested?: boolean;
  trigger?: React.ReactNode;
}

function normalizeOptionalText(value: string): string | undefined {
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function requireText(value: string, message: string): string {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    throw new Error(message);
  }
  return normalized;
}

function resolveNextDisplayOrder(priceLists: CatalogPriceList[]): number {
  return (
    priceLists.reduce(
      (maxOrder, priceList) => Math.max(maxOrder, priceList.displayOrder),
      -1,
    ) + 1
  );
}

function sortPriceLists(priceLists: CatalogPriceList[]): CatalogPriceList[] {
  return priceLists
    .filter((priceList) => !priceList.deleteAt)
    .slice()
    .sort((left, right) => {
      if (left.displayOrder !== right.displayOrder) {
        return left.displayOrder - right.displayOrder;
      }

      return left.name.localeCompare(right.name, "ru");
    });
}

function toDraft(priceList: CatalogPriceList): PriceListDraft {
  return {
    isActive: priceList.isActive,
    name: priceList.name,
  };
}

function buildCreatePayload(draft: PriceListDraft, displayOrder: number) {
  return {
    displayOrder,
    isActive: draft.isActive,
    name: requireText(draft.name, "Введите название прайс-листа."),
  };
}

function buildUpdatePayload(draft: PriceListDraft) {
  return {
    isActive: draft.isActive,
    name: requireText(draft.name, "Введите название прайс-листа."),
  };
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return extractApiErrorMessage(error);
}

function PriceListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="rounded-control border border-line-subtle p-2.5"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="size-9 rounded-control" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="size-8 rounded-control" />
            <Skeleton className="size-8 rounded-control" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface PriceListItemProps {
  attributes?: DraggableAttributes;
  disabled?: boolean;
  draft: PriceListDraft;
  handleRef?: (element: HTMLElement | null) => void;
  index: number;
  isDragging?: boolean;
  isEditing?: boolean;
  isOverlay?: boolean;
  isSaving?: boolean;
  listeners?: DraggableSyntheticListeners;
  priceList: CatalogPriceList;
  onCancelEdit?: () => void;
  onDelete?: () => void;
  onDraftActiveChange?: (value: boolean) => void;
  onDraftNameChange?: (value: string) => void;
  onEdit?: () => void;
  onSave?: () => void;
}

const PriceListItem: React.FC<PriceListItemProps> = ({
  attributes,
  disabled = false,
  draft,
  handleRef,
  index,
  isDragging = false,
  isEditing = false,
  isOverlay = false,
  isSaving = false,
  listeners,
  priceList,
  onCancelEdit,
  onDelete,
  onDraftActiveChange,
  onDraftNameChange,
  onEdit,
  onSave,
}) => {
  return (
    <div
      className={cn(
        "rounded-control border border-line-subtle bg-surface-base p-2.5 transition-shadow",
        isDragging && "shadow-surface ring-1 ring-line-default",
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        {isOverlay ? (
          <div className="flex size-8 items-center justify-center rounded-control text-text-muted">
            <GripVertical className="size-4" />
          </div>
        ) : (
          <button
            type="button"
            {...attributes}
            {...listeners}
            ref={handleRef}
            data-vaul-no-drag=""
            disabled={disabled}
            style={{
              touchAction: "none",
              WebkitTapHighlightColor: "transparent",
            }}
            className="flex size-8 touch-none items-center justify-center rounded-control text-text-muted transition-colors hover:bg-surface-muted focus-visible:ring-1 focus-visible:ring-action-primary focus-visible:outline-none active:cursor-grabbing disabled:pointer-events-none disabled:opacity-40"
            aria-label={`Переместить ${priceList.name}`}
          >
            <GripVertical className="size-4" />
          </button>
        )}

        <Badge variant="secondary" className="min-w-7 justify-center px-2">
          {index + 1}
        </Badge>

        <div className="min-w-0 flex-1">
          {isEditing && !isOverlay ? (
            <div className="grid gap-2">
              <Input
                autoFocus
                value={draft.name}
                disabled={disabled}
                className="h-8 min-w-0 px-2.5 text-sm"
                placeholder="Название"
                onChange={(event) => onDraftNameChange?.(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onSave?.();
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    onCancelEdit?.();
                  }
                }}
              />
              <label className="flex w-fit items-center gap-2 text-xs text-text-muted">
                <Switch
                  checked={draft.isActive}
                  disabled={disabled}
                  onCheckedChange={(checked) => onDraftActiveChange?.(checked)}
                />
                Активен
              </label>
            </div>
          ) : (
            <div className="min-w-0 space-y-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {priceList.name}
                </span>
                {!priceList.isActive ? (
                  <Badge variant="outline" className="shrink-0">
                    Отключен
                  </Badge>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {isOverlay ? null : isEditing ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={disabled || isSaving}
              className="size-8"
              title="Сохранить"
              onClick={onSave}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={disabled || isSaving}
              className="size-8"
              title="Отмена"
              onClick={onCancelEdit}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={disabled}
              className="size-8"
              title="Редактировать"
              onClick={onEdit}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={disabled}
              className="size-8 text-text-muted hover:bg-status-danger-surface hover:text-status-danger"
              title="Удалить"
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

interface SortablePriceListItemProps {
  disabled?: boolean;
  draft: PriceListDraft;
  index: number;
  isEditing: boolean;
  isSaving?: boolean;
  priceList: CatalogPriceList;
  onCancelEdit: () => void;
  onDelete: () => void;
  onDraftActiveChange: (value: boolean) => void;
  onDraftNameChange: (value: string) => void;
  onEdit: () => void;
  onSave: () => void;
}

const SortablePriceListItem: React.FC<SortablePriceListItemProps> = ({
  disabled = false,
  draft,
  index,
  isEditing,
  isSaving = false,
  priceList,
  onCancelEdit,
  onDelete,
  onDraftActiveChange,
  onDraftNameChange,
  onEdit,
  onSave,
}) => {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: priceList.id,
    disabled,
    transition: {
      duration: 180,
      easing: "cubic-bezier(0.22,1,0.36,1)",
    },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      data-vaul-no-drag=""
      className={cn("relative select-none", isDragging && "z-50 opacity-40")}
    >
      <PriceListItem
        attributes={attributes}
        disabled={disabled}
        draft={draft}
        handleRef={setActivatorNodeRef}
        index={index}
        isDragging={isDragging}
        isEditing={isEditing}
        isSaving={isSaving}
        listeners={listeners}
        priceList={priceList}
        onCancelEdit={onCancelEdit}
        onDelete={onDelete}
        onDraftActiveChange={onDraftActiveChange}
        onDraftNameChange={onDraftNameChange}
        onEdit={onEdit}
        onSave={onSave}
      />
    </div>
  );
};

interface PriceListSortableListProps {
  disabled?: boolean;
  draftsById: Record<string, PriceListDraft>;
  editingId: string | null;
  isSaving?: boolean;
  priceLists: CatalogPriceList[];
  onCancelEdit: (priceList: CatalogPriceList) => void;
  onDelete: (priceList: CatalogPriceList) => void;
  onDraftActiveChange: (priceList: CatalogPriceList, value: boolean) => void;
  onDraftNameChange: (priceList: CatalogPriceList, value: string) => void;
  onEdit: (priceList: CatalogPriceList) => void;
  onReorder: (params: { activeId: string; overId: string }) => void;
  onSave: (priceList: CatalogPriceList) => void;
}

const PriceListSortableList: React.FC<PriceListSortableListProps> = ({
  disabled = false,
  draftsById,
  editingId,
  isSaving = false,
  priceLists,
  onCancelEdit,
  onDelete,
  onDraftActiveChange,
  onDraftNameChange,
  onEdit,
  onReorder,
  onSave,
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = React.useCallback(
    (event: DragStartEvent) => {
      if (disabled) {
        return;
      }

      setActiveId(String(event.active.id));
    },
    [disabled],
  );

  const handleDragCancel = React.useCallback(() => {
    setActiveId(null);
  }, []);

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!disabled && over && active.id !== over.id) {
        onReorder({
          activeId: String(active.id),
          overId: String(over.id),
        });
      }

      setActiveId(null);
    },
    [disabled, onReorder],
  );

  const activePriceList = React.useMemo(
    () =>
      activeId
        ? (priceLists.find((priceList) => priceList.id === activeId) ?? null)
        : null,
    [activeId, priceLists],
  );
  const activePriceListIndex = React.useMemo(
    () =>
      activePriceList
        ? priceLists.findIndex((item) => item.id === activePriceList.id)
        : -1,
    [activePriceList, priceLists],
  );
  const overlay = (
    <DragOverlay
      zIndex={60}
      modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
    >
      {activePriceList && activePriceListIndex >= 0 ? (
        <div className="w-full max-w-[calc(100vw-2rem)]">
          <PriceListItem
            draft={draftsById[activePriceList.id] ?? toDraft(activePriceList)}
            index={activePriceListIndex}
            isDragging
            isOverlay
            priceList={activePriceList}
          />
        </div>
      ) : null}
    </DragOverlay>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={priceLists.map((priceList) => priceList.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2" data-vaul-no-drag="">
          {priceLists.map((priceList, index) => (
            <SortablePriceListItem
              key={priceList.id}
              disabled={disabled}
              draft={draftsById[priceList.id] ?? toDraft(priceList)}
              index={index}
              isEditing={editingId === priceList.id}
              isSaving={isSaving}
              priceList={priceList}
              onCancelEdit={() => onCancelEdit(priceList)}
              onDelete={() => onDelete(priceList)}
              onDraftActiveChange={(value) =>
                onDraftActiveChange(priceList, value)
              }
              onDraftNameChange={(value) => onDraftNameChange(priceList, value)}
              onEdit={() => onEdit(priceList)}
              onSave={() => onSave(priceList)}
            />
          ))}
        </div>
      </SortableContext>

      {typeof document !== "undefined"
        ? createPortal(overlay, document.body)
        : overlay}
    </DndContext>
  );
};

export const ProductPriceListSettingsDrawer: React.FC<
  ProductPriceListSettingsDrawerProps
> = ({ children, disabled = false, nested = true, trigger }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [createDraft, setCreateDraft] =
    React.useState<PriceListDraft>(emptyCreateDraft);
  const [draftsById, setDraftsById] = React.useState<
    Record<string, PriceListDraft>
  >({});
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [orderedIds, setOrderedIds] = React.useState<string[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const priceListsQuery = useCatalogPriceLists(
    { includeInactive: true },
    { enabled: open && !disabled },
  );
  const createMutation = useMutation({ mutationFn: createCatalogPriceList });
  const updateMutation = useMutation({ mutationFn: updateCatalogPriceList });
  const archiveMutation = useMutation({ mutationFn: archiveCatalogPriceList });

  const backendPriceLists = React.useMemo(
    () => sortPriceLists(priceListsQuery.data ?? []),
    [priceListsQuery.data],
  );
  const backendOrderKey = React.useMemo(
    () => backendPriceLists.map((priceList) => priceList.id).join("|"),
    [backendPriceLists],
  );

  React.useEffect(() => {
    setOrderedIds(backendPriceLists.map((priceList) => priceList.id));
  }, [backendOrderKey, backendPriceLists]);

  const priceLists = React.useMemo(() => {
    const byId = new Map(
      backendPriceLists.map((priceList) => [priceList.id, priceList]),
    );
    const ordered = orderedIds
      .map((id) => byId.get(id))
      .filter((priceList): priceList is CatalogPriceList => Boolean(priceList));
    const orderedIdSet = new Set(ordered.map((priceList) => priceList.id));
    const missing = backendPriceLists.filter(
      (priceList) => !orderedIdSet.has(priceList.id),
    );

    return [...ordered, ...missing];
  }, [backendPriceLists, orderedIds]);

  const activeCount = priceLists.filter(
    (priceList) => priceList.isActive,
  ).length;
  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    archiveMutation.isPending;
  const isBusy = disabled || isMutating;

  React.useEffect(() => {
    setDraftsById(
      Object.fromEntries(
        priceLists.map((priceList) => [priceList.id, toDraft(priceList)]),
      ),
    );
  }, [priceLists]);

  const refreshPriceLists = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: catalogPriceListQueryKeys.all,
      }),
      queryClient.invalidateQueries({
        queryKey: getCatalogControllerGetCurrentQueryKey(),
      }),
      invalidateProductQueries(queryClient),
    ]);
  }, [queryClient]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      setErrorMessage(null);

      if (nextOpen) {
        void priceListsQuery.refetch();
      }
    },
    [priceListsQuery],
  );

  const handleError = React.useCallback((error: unknown) => {
    const message = resolveErrorMessage(error);
    setErrorMessage(message);
    toast.error(message);
  }, []);

  const handleCreate = React.useCallback(async () => {
    try {
      setErrorMessage(null);
      await createMutation.mutateAsync(
        buildCreatePayload(createDraft, resolveNextDisplayOrder(priceLists)),
      );
      setCreateDraft(emptyCreateDraft);
      toast.success("Прайс-лист создан.");
      await refreshPriceLists();
    } catch (error) {
      handleError(error);
    }
  }, [createDraft, createMutation, handleError, priceLists, refreshPriceLists]);

  const handleEdit = React.useCallback((priceList: CatalogPriceList) => {
    setDraftsById((current) => ({
      ...current,
      [priceList.id]: current[priceList.id] ?? toDraft(priceList),
    }));
    setEditingId(priceList.id);
  }, []);

  const handleCancelEdit = React.useCallback((priceList: CatalogPriceList) => {
    setDraftsById((current) => ({
      ...current,
      [priceList.id]: toDraft(priceList),
    }));
    setEditingId((current) => (current === priceList.id ? null : current));
  }, []);

  const handleDraftNameChange = React.useCallback(
    (priceList: CatalogPriceList, value: string) => {
      setDraftsById((current) => ({
        ...current,
        [priceList.id]: {
          ...(current[priceList.id] ?? toDraft(priceList)),
          name: value,
        },
      }));
    },
    [],
  );

  const handleDraftActiveChange = React.useCallback(
    (priceList: CatalogPriceList, value: boolean) => {
      setDraftsById((current) => ({
        ...current,
        [priceList.id]: {
          ...(current[priceList.id] ?? toDraft(priceList)),
          isActive: value,
        },
      }));
    },
    [],
  );

  const handleSave = React.useCallback(
    async (priceList: CatalogPriceList) => {
      const draft = draftsById[priceList.id];
      if (!draft) return;

      try {
        setErrorMessage(null);
        const updated = await updateMutation.mutateAsync({
          id: priceList.id,
          payload: buildUpdatePayload(draft),
        });
        setDraftsById((current) => ({
          ...current,
          [priceList.id]: toDraft(updated),
        }));
        setEditingId((current) => (current === priceList.id ? null : current));
        toast.success("Прайс-лист сохранен.");
        await refreshPriceLists();
      } catch (error) {
        handleError(error);
      }
    },
    [draftsById, handleError, refreshPriceLists, updateMutation],
  );

  const handleReorder = React.useCallback(
    async ({ activeId, overId }: { activeId: string; overId: string }) => {
      const currentIndex = priceLists.findIndex((item) => item.id === activeId);
      const nextIndex = priceLists.findIndex((item) => item.id === overId);

      if (currentIndex < 0 || nextIndex < 0 || currentIndex === nextIndex) {
        return;
      }

      const reordered = priceLists.slice();
      const [movingPriceList] = reordered.splice(currentIndex, 1);
      if (!movingPriceList) {
        return;
      }

      reordered.splice(nextIndex, 0, movingPriceList);
      setOrderedIds(reordered.map((priceList) => priceList.id));

      try {
        setErrorMessage(null);
        await Promise.all(
          reordered.map((priceList, index) =>
            priceList.displayOrder === index
              ? Promise.resolve()
              : updateMutation.mutateAsync({
                  id: priceList.id,
                  payload: { displayOrder: index },
                }),
          ),
        );
        await refreshPriceLists();
      } catch (error) {
        setOrderedIds(priceLists.map((priceList) => priceList.id));
        handleError(error);
      }
    },
    [handleError, priceLists, refreshPriceLists, updateMutation],
  );

  const handleDelete = React.useCallback(
    async (priceList: CatalogPriceList) => {
      const confirmed = await confirmDelete({
        title: "Удалить прайс-лист?",
        description: `Прайс-лист "${priceList.name}" будет скрыт из настроек и новых товаров.`,
        confirmText: "Удалить",
        cancelText: "Отмена",
        tone: "destructive",
      });

      if (!confirmed) return;

      try {
        setErrorMessage(null);
        await archiveMutation.mutateAsync(priceList.id);
        toast.success("Прайс-лист удален.");
        await refreshPriceLists();
      } catch (error) {
        handleError(error);
      }
    },
    [archiveMutation, handleError, refreshPriceLists],
  );

  const defaultTrigger = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 shrink-0 border-line-default bg-transparent px-2.5 text-text-muted shadow-none hover:border-line-default hover:bg-surface-muted hover:text-text-primary"
      disabled={disabled}
      title="Настроить прайс-листы"
    >
      <Plus className="size-4" />
      Прайс-листы
      <Badge variant="secondary" className="ml-1 px-1.5 text-[10px]">
        Бета
      </Badge>
      <ChevronRight className="size-4" />
    </Button>
  );

  return (
    <AppDrawer
      nested={nested}
      open={open}
      onOpenChange={handleOpenChange}
      dismissible={!isMutating}
      trigger={trigger ?? defaultTrigger}
    >
      <AppDrawer.Content className="w-full max-w-2xl">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Прайс-листы"
            description="Создавайте прайсы, переименовывайте их и меняйте порядок перетаскиванием."
            withCloseButton={!isMutating}
          />
          <hr />

          <DrawerScrollArea className="px-4 py-4">
            <div className="space-y-3">
              <section className="min-w-0">
                <div className="flex min-w-0 gap-2">
                  <Input
                    className="h-9 min-w-0 px-3 py-2 text-sm"
                    value={createDraft.name}
                    disabled={isBusy}
                    placeholder="Новый прайс-лист"
                    onChange={(event) =>
                      setCreateDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleCreate();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="size-9 shrink-0"
                    disabled={isBusy || !createDraft.name.trim()}
                    title="Создать прайс-лист"
                    onClick={() => void handleCreate()}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </Button>
                </div>
              </section>

              <section className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 text-sm font-medium">
                    Справочник
                    {priceLists.length > 0 ? (
                      <span className="ml-2 text-xs font-normal text-text-muted">
                        {activeCount} активн.
                      </span>
                    ) : null}
                  </div>

                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-8"
                    disabled={isBusy || priceListsQuery.isFetching}
                    title="Обновить"
                    onClick={() => void priceListsQuery.refetch()}
                  >
                    <RefreshCw
                      className={cn(
                        "size-4",
                        priceListsQuery.isFetching && "animate-spin",
                      )}
                    />
                  </Button>
                </div>

                {priceListsQuery.isLoading ? <PriceListSkeleton /> : null}

                {priceListsQuery.isError ? (
                  <div className="rounded-control border border-line-subtle bg-surface-muted/30 p-3 text-sm text-text-muted">
                    Не удалось загрузить прайс-листы.
                  </div>
                ) : null}

                {!priceListsQuery.isLoading &&
                !priceListsQuery.isError &&
                priceLists.length === 0 ? (
                  <div className="rounded-control border border-dashed border-line-subtle p-3 text-sm text-text-muted">
                    Прайс-листов пока нет.
                  </div>
                ) : null}

                {priceLists.length > 0 ? (
                  <PriceListSortableList
                    disabled={isBusy}
                    draftsById={draftsById}
                    editingId={editingId}
                    isSaving={updateMutation.isPending}
                    priceLists={priceLists}
                    onCancelEdit={handleCancelEdit}
                    onDelete={(priceList) => void handleDelete(priceList)}
                    onDraftActiveChange={handleDraftActiveChange}
                    onDraftNameChange={handleDraftNameChange}
                    onEdit={handleEdit}
                    onReorder={(params) => void handleReorder(params)}
                    onSave={(priceList) => void handleSave(priceList)}
                  />
                ) : null}

                {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
              </section>

              {children ? (
                <section className="space-y-2 border-t pt-3">
                  <div className="text-sm font-medium">Цены товара</div>
                  {children}
                </section>
              ) : null}
            </div>
          </DrawerScrollArea>

          <AppDrawer.Footer
            className="border-t"
            btnText="Готово"
            buttonType="button"
          />
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
