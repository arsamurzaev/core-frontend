"use client";

import { invalidateProductQueries } from "@/core/modules/product";
import {
  ADVANCED_SALE_UNITS_QUERY_KEY,
  archiveAdvancedCatalogSaleUnit,
  createAdvancedCatalogSaleUnit,
  listAdvancedCatalogSaleUnits,
  updateAdvancedCatalogSaleUnit,
} from "@/core/widgets/edit-catalog-drawer/model/catalog-sale-units-settings-api";
import { type CatalogSaleUnitDto } from "@/shared/api/generated/react-query";
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
import {
  type QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

type SaleUnitDraft = {
  name: string;
};

const emptyCreateDraft = {
  name: "",
};

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

function resolveNextDisplayOrder(units: CatalogSaleUnitDto[]): number {
  return (
    units.reduce(
      (maxOrder, unit) => Math.max(maxOrder, unit.displayOrder),
      -1,
    ) + 1
  );
}

function toDraft(unit: CatalogSaleUnitDto): SaleUnitDraft {
  return {
    name: unit.name,
  };
}

function buildCreatePayload(
  draft: typeof emptyCreateDraft,
  displayOrder: number,
) {
  return {
    name: requireText(draft.name, "Введите название единицы измерения."),
    displayOrder,
  };
}

function buildUpdatePayload(draft: SaleUnitDraft) {
  return {
    name: requireText(draft.name, "Введите название единицы измерения."),
  };
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return extractApiErrorMessage(error);
}

function isGeneratedSaleUnitQuery(queryKey: QueryKey): boolean {
  return queryKey[0] === "/catalog-sale-unit";
}

function sortSaleUnits(units: CatalogSaleUnitDto[]): CatalogSaleUnitDto[] {
  return units
    .filter((unit) => !unit.deleteAt)
    .slice()
    .sort((left, right) => {
      if (left.displayOrder !== right.displayOrder) {
        return left.displayOrder - right.displayOrder;
      }

      return left.name.localeCompare(right.name, "ru");
    });
}

function SaleUnitSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="rounded-md border border-border p-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="size-9 rounded-md" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="size-8 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface SaleUnitListItemProps {
  attributes?: DraggableAttributes;
  disabled?: boolean;
  draft: SaleUnitDraft;
  handleRef?: (element: HTMLElement | null) => void;
  index: number;
  isDragging?: boolean;
  isEditing?: boolean;
  isOverlay?: boolean;
  isSaving?: boolean;
  listeners?: DraggableSyntheticListeners;
  unit: CatalogSaleUnitDto;
  onCancelEdit?: () => void;
  onDelete?: () => void;
  onDraftNameChange?: (value: string) => void;
  onEdit?: () => void;
  onSave?: () => void;
}

const SaleUnitListItem: React.FC<SaleUnitListItemProps> = ({
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
  unit,
  onCancelEdit,
  onDelete,
  onDraftNameChange,
  onEdit,
  onSave,
}) => {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-background p-2.5 transition-shadow",
        isDragging && "shadow-xl ring-1 ring-black/10",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {isOverlay ? (
          <div className="flex size-8 items-center justify-center rounded-md text-muted-foreground">
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
            className="flex size-8 touch-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:cursor-grabbing disabled:pointer-events-none disabled:opacity-40"
            aria-label={`Переместить ${unit.name}`}
          >
            <GripVertical className="size-4" />
          </button>
        )}

        <Badge variant="secondary" className="min-w-7 justify-center px-2">
          {index + 1}
        </Badge>

        <div className="min-w-0 flex-1">
          {isEditing && !isOverlay ? (
            <Input
              autoFocus
              value={draft.name}
              disabled={disabled}
              className="h-8 min-w-0 px-2.5 text-sm"
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
          ) : (
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-medium">{unit.name}</span>
              {!unit.isActive ? (
                <Badge variant="outline" className="shrink-0">
                  Отключена
                </Badge>
              ) : null}
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
              className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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

interface SortableSaleUnitListItemProps {
  disabled?: boolean;
  draft: SaleUnitDraft;
  index: number;
  isEditing: boolean;
  isSaving?: boolean;
  unit: CatalogSaleUnitDto;
  onCancelEdit: () => void;
  onDelete: () => void;
  onDraftNameChange: (value: string) => void;
  onEdit: () => void;
  onSave: () => void;
}

const SortableSaleUnitListItem: React.FC<SortableSaleUnitListItemProps> = ({
  disabled = false,
  draft,
  index,
  isEditing,
  isSaving = false,
  unit,
  onCancelEdit,
  onDelete,
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
    id: unit.id,
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
      <SaleUnitListItem
        attributes={attributes}
        disabled={disabled}
        draft={draft}
        handleRef={setActivatorNodeRef}
        index={index}
        isDragging={isDragging}
        isEditing={isEditing}
        isSaving={isSaving}
        listeners={listeners}
        unit={unit}
        onCancelEdit={onCancelEdit}
        onDelete={onDelete}
        onDraftNameChange={onDraftNameChange}
        onEdit={onEdit}
        onSave={onSave}
      />
    </div>
  );
};

interface SaleUnitSortableListProps {
  disabled?: boolean;
  draftsById: Record<string, SaleUnitDraft>;
  editingId: string | null;
  isSaving?: boolean;
  units: CatalogSaleUnitDto[];
  onCancelEdit: (unit: CatalogSaleUnitDto) => void;
  onDelete: (unit: CatalogSaleUnitDto) => void;
  onDraftNameChange: (unit: CatalogSaleUnitDto, value: string) => void;
  onEdit: (unit: CatalogSaleUnitDto) => void;
  onReorder: (params: { activeId: string; overId: string }) => void;
  onSave: (unit: CatalogSaleUnitDto) => void;
}

const SaleUnitSortableList: React.FC<SaleUnitSortableListProps> = ({
  disabled = false,
  draftsById,
  editingId,
  isSaving = false,
  units,
  onCancelEdit,
  onDelete,
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

  const activeUnit = React.useMemo(
    () => (activeId ? units.find((unit) => unit.id === activeId) ?? null : null),
    [activeId, units],
  );
  const activeUnitIndex = React.useMemo(
    () => (activeUnit ? units.findIndex((unit) => unit.id === activeUnit.id) : -1),
    [activeUnit, units],
  );
  const overlay = (
    <DragOverlay
      zIndex={60}
      modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
    >
      {activeUnit && activeUnitIndex >= 0 ? (
        <div className="w-full max-w-[calc(100vw-2rem)]">
          <SaleUnitListItem
            draft={draftsById[activeUnit.id] ?? toDraft(activeUnit)}
            index={activeUnitIndex}
            isDragging
            isOverlay
            unit={activeUnit}
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
        items={units.map((unit) => unit.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2" data-vaul-no-drag="">
          {units.map((unit, index) => (
            <SortableSaleUnitListItem
              key={unit.id}
              disabled={disabled}
              draft={draftsById[unit.id] ?? toDraft(unit)}
              index={index}
              isEditing={editingId === unit.id}
              isSaving={isSaving}
              unit={unit}
              onCancelEdit={() => onCancelEdit(unit)}
              onDelete={() => onDelete(unit)}
              onDraftNameChange={(value) => onDraftNameChange(unit, value)}
              onEdit={() => onEdit(unit)}
              onSave={() => onSave(unit)}
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

interface EditCatalogSaleUnitsDrawerProps {
  disabled?: boolean;
  nested?: boolean;
  trigger?: React.ReactNode;
}

export const EditCatalogSaleUnitsDrawer: React.FC<
  EditCatalogSaleUnitsDrawerProps
> = ({ disabled = false, nested = true, trigger }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [createDraft, setCreateDraft] = React.useState(emptyCreateDraft);
  const [draftsById, setDraftsById] = React.useState<
    Record<string, SaleUnitDraft>
  >({});
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [orderedIds, setOrderedIds] = React.useState<string[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const saleUnitsQuery = useQuery({
    queryKey: [
      ...ADVANCED_SALE_UNITS_QUERY_KEY,
      { includeInactive: true, includeArchived: false },
    ],
    queryFn: () =>
      listAdvancedCatalogSaleUnits({
        includeInactive: true,
        includeArchived: false,
      }),
    enabled: !disabled,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: createAdvancedCatalogSaleUnit,
  });
  const updateMutation = useMutation({
    mutationFn: updateAdvancedCatalogSaleUnit,
  });
  const archiveMutation = useMutation({
    mutationFn: archiveAdvancedCatalogSaleUnit,
  });

  const backendSaleUnits = React.useMemo(
    () => sortSaleUnits(saleUnitsQuery.data ?? []),
    [saleUnitsQuery.data],
  );
  const backendOrderKey = React.useMemo(
    () => backendSaleUnits.map((unit) => unit.id).join("|"),
    [backendSaleUnits],
  );

  React.useEffect(() => {
    setOrderedIds(backendSaleUnits.map((unit) => unit.id));
  }, [backendOrderKey, backendSaleUnits]);

  const saleUnits = React.useMemo(() => {
    const byId = new Map(backendSaleUnits.map((unit) => [unit.id, unit]));
    const ordered = orderedIds
      .map((id) => byId.get(id))
      .filter((unit): unit is CatalogSaleUnitDto => Boolean(unit));
    const orderedIdSet = new Set(ordered.map((unit) => unit.id));
    const missing = backendSaleUnits.filter((unit) => !orderedIdSet.has(unit.id));

    return [...ordered, ...missing];
  }, [backendSaleUnits, orderedIds]);

  const activeCount = saleUnits.filter((unit) => unit.isActive).length;
  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    archiveMutation.isPending;
  const isBusy = disabled || isMutating;

  React.useEffect(() => {
    setDraftsById(
      Object.fromEntries(saleUnits.map((unit) => [unit.id, toDraft(unit)])),
    );
  }, [saleUnits]);

  const refreshSaleUnits = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ADVANCED_SALE_UNITS_QUERY_KEY,
      }),
      queryClient.invalidateQueries({
        predicate: (query) => isGeneratedSaleUnitQuery(query.queryKey),
      }),
      invalidateProductQueries(queryClient),
    ]);
  }, [queryClient]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      setErrorMessage(null);

      if (nextOpen) {
        void saleUnitsQuery.refetch();
      }
    },
    [saleUnitsQuery],
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
        buildCreatePayload(createDraft, resolveNextDisplayOrder(saleUnits)),
      );
      setCreateDraft(emptyCreateDraft);
      toast.success("Единица измерения создана.");
      await refreshSaleUnits();
    } catch (error) {
      handleError(error);
    }
  }, [createDraft, createMutation, handleError, refreshSaleUnits, saleUnits]);

  const handleEdit = React.useCallback((unit: CatalogSaleUnitDto) => {
    setDraftsById((current) => ({
      ...current,
      [unit.id]: current[unit.id] ?? toDraft(unit),
    }));
    setEditingId(unit.id);
  }, []);

  const handleCancelEdit = React.useCallback((unit: CatalogSaleUnitDto) => {
    setDraftsById((current) => ({
      ...current,
      [unit.id]: toDraft(unit),
    }));
    setEditingId((current) => (current === unit.id ? null : current));
  }, []);

  const handleDraftNameChange = React.useCallback(
    (unit: CatalogSaleUnitDto, value: string) => {
      setDraftsById((current) => ({
        ...current,
        [unit.id]: {
          ...(current[unit.id] ?? toDraft(unit)),
          name: value,
        },
      }));
    },
    [],
  );

  const handleSave = React.useCallback(
    async (unit: CatalogSaleUnitDto) => {
      const draft = draftsById[unit.id];
      if (!draft) return;

      try {
        setErrorMessage(null);
        const updated = await updateMutation.mutateAsync({
          id: unit.id,
          payload: buildUpdatePayload(draft),
        });
        setDraftsById((current) => ({
          ...current,
          [unit.id]: toDraft(updated),
        }));
        setEditingId((current) => (current === unit.id ? null : current));
        toast.success("Единица измерения сохранена.");
        await refreshSaleUnits();
      } catch (error) {
        handleError(error);
      }
    },
    [draftsById, handleError, refreshSaleUnits, updateMutation],
  );

  const handleReorder = React.useCallback(
    async ({ activeId, overId }: { activeId: string; overId: string }) => {
      const currentIndex = saleUnits.findIndex((unit) => unit.id === activeId);
      const nextIndex = saleUnits.findIndex((unit) => unit.id === overId);

      if (currentIndex < 0 || nextIndex < 0 || currentIndex === nextIndex) {
        return;
      }

      const reordered = saleUnits.slice();
      const [movingUnit] = reordered.splice(currentIndex, 1);
      if (!movingUnit) {
        return;
      }

      reordered.splice(nextIndex, 0, movingUnit);
      setOrderedIds(reordered.map((unit) => unit.id));

      try {
        setErrorMessage(null);
        await Promise.all(
          reordered.map((unit, index) =>
            unit.displayOrder === index
              ? Promise.resolve()
              : updateMutation.mutateAsync({
                  id: unit.id,
                  payload: { displayOrder: index },
                }),
          ),
        );
        await refreshSaleUnits();
      } catch (error) {
        setOrderedIds(saleUnits.map((unit) => unit.id));
        handleError(error);
      }
    },
    [handleError, refreshSaleUnits, saleUnits, updateMutation],
  );

  const handleDelete = React.useCallback(
    async (unit: CatalogSaleUnitDto) => {
      const confirmed = await confirmDelete({
        title: "Удалить единицу измерения?",
        description: `Формат "${unit.name}" исчезнет из выбора для новых товаров. В существующих товарах привязки сохранятся.`,
        confirmText: "Удалить",
        cancelText: "Отмена",
        tone: "destructive",
      });

      if (!confirmed) return;

      try {
        setErrorMessage(null);
        await archiveMutation.mutateAsync(unit.id);
        toast.success("Единица измерения удалена.");
        await refreshSaleUnits();
      } catch (error) {
        handleError(error);
      }
    },
    [archiveMutation, handleError, refreshSaleUnits],
  );

  const defaultTrigger = (
    <Button
      type="button"
      variant="ghost"
      className="h-auto w-full min-w-0 items-start justify-between rounded-2xl border border-black/10 px-4 py-4 text-left whitespace-normal hover:bg-muted/30"
      disabled={disabled}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Единицы измерения
          </span>
          <Badge variant="secondary">
            {activeCount > 0 ? `${activeCount} активн.` : "Не настроено"}
          </Badge>
        </div>
        <p className="mt-1 break-words text-sm text-muted-foreground whitespace-normal">
          Глобальный список форматов: штука, упаковка, ящик и другие единицы.
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
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
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Единицы измерения"
            description="Создавайте форматы, переименовывайте их и меняйте порядок перетаскиванием."
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
                    placeholder="Новый формат"
                    onChange={(event) =>
                      setCreateDraft({ name: event.target.value })
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
                    title="Создать единицу"
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
                  <div className="min-w-0 text-sm font-medium">Справочник</div>

                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-8"
                    disabled={isBusy || saleUnitsQuery.isFetching}
                    title="Обновить"
                    onClick={() => void saleUnitsQuery.refetch()}
                  >
                    <RefreshCw
                      className={cn(
                        "size-4",
                        saleUnitsQuery.isFetching && "animate-spin",
                      )}
                    />
                  </Button>
                </div>

                {saleUnitsQuery.isLoading ? <SaleUnitSkeleton /> : null}

                {saleUnitsQuery.isError ? (
                  <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                    Не удалось загрузить единицы измерения.
                  </div>
                ) : null}

                {!saleUnitsQuery.isLoading &&
                !saleUnitsQuery.isError &&
                saleUnits.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                    Единиц пока нет.
                  </div>
                ) : null}

                {saleUnits.length > 0 ? (
                  <SaleUnitSortableList
                    disabled={isBusy}
                    draftsById={draftsById}
                    editingId={editingId}
                    isSaving={updateMutation.isPending}
                    units={saleUnits}
                    onCancelEdit={handleCancelEdit}
                    onDelete={(unit) => void handleDelete(unit)}
                    onDraftNameChange={handleDraftNameChange}
                    onEdit={handleEdit}
                    onReorder={(params) => void handleReorder(params)}
                    onSave={(unit) => void handleSave(unit)}
                  />
                ) : null}

                {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
              </section>
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
