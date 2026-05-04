"use client";

import { type CategoryDto } from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import { AppDrawer } from "@/shared/ui/app-drawer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { DrawerScrollArea } from "@/shared/ui/drawer";
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
import { GripVertical, Loader2 } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";

interface CategoryReorderItemProps {
  category: CategoryDto;
  index: number;
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  handleRef?: (element: HTMLElement | null) => void;
  isDragging?: boolean;
  isOverlay?: boolean;
  disabled?: boolean;
}

function formatCategoryProductCount(count: number) {
  const normalizedCount = Math.max(0, count);
  const lastDigit = normalizedCount % 10;
  const lastTwoDigits = normalizedCount % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${normalizedCount} товаров`;
  }

  if (lastDigit === 1) {
    return `${normalizedCount} товар`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${normalizedCount} товара`;
  }

  return `${normalizedCount} товаров`;
}

const CategoryReorderItem: React.FC<CategoryReorderItemProps> = ({
  category,
  index,
  attributes,
  listeners,
  handleRef,
  isDragging = false,
  isOverlay = false,
  disabled = false,
}) => {
  return (
    <Card
      className={cn(
        "transition-shadow",
        isDragging && "shadow-2xl ring-1 ring-black/10",
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isOverlay ? (
              <div className="text-muted-foreground rounded-full p-2">
                <GripVertical className="size-5" />
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
                className="text-muted-foreground flex size-11 touch-none items-center justify-center rounded-full transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:cursor-grabbing disabled:pointer-events-none disabled:opacity-40"
                aria-label={`Переместить категорию ${category.name}`}
              >
                <GripVertical className="size-5" />
              </button>
            )}

            <Badge
              variant="secondary"
              className="min-w-7 rounded-full px-2 py-1 text-xs"
            >
              {index + 1}
            </Badge>
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-medium sm:text-base">
              {category.name}
            </h4>
            {category.descriptor ? (
              <p className="text-muted-foreground truncate text-xs sm:text-sm">
                {category.descriptor}
              </p>
            ) : null}
            <p className="text-muted-foreground truncate text-xs sm:text-sm">
              {formatCategoryProductCount(category.productCount ?? 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface SortableCategoryReorderItemProps {
  category: CategoryDto;
  disabled?: boolean;
  index: number;
  isDragging?: boolean;
}

const SortableCategoryReorderItem: React.FC<
  SortableCategoryReorderItemProps
> = ({ category, disabled = false, index, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: category.id,
    disabled,
    transition: {
      duration: 180,
      easing: "cubic-bezier(0.22,1,0.36,1)",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBeingDragged = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-vaul-no-drag=""
      className={cn(
        "relative select-none",
        isBeingDragged && "z-50 opacity-40",
        disabled && "opacity-80",
      )}
    >
      <CategoryReorderItem
        category={category}
        index={index}
        attributes={attributes}
        listeners={listeners}
        handleRef={setActivatorNodeRef}
        isDragging={isBeingDragged}
        disabled={disabled}
      />
    </div>
  );
};

interface CategoryReorderListProps {
  categories: CategoryDto[];
  disabled?: boolean;
  onReorder: (params: { activeId: string; overId: string }) => void;
}

const CategoryReorderList: React.FC<CategoryReorderListProps> = ({
  categories,
  disabled = false,
  onReorder,
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

  const activeCategory = React.useMemo(
    () =>
      activeId
        ? categories.find((category) => category.id === activeId) ?? null
        : null,
    [activeId, categories],
  );

  const activeCategoryIndex = React.useMemo(
    () =>
      activeCategory
        ? categories.findIndex((category) => category.id === activeCategory.id)
        : -1,
    [activeCategory, categories],
  );

  const overlay = (
    <DragOverlay
      zIndex={60}
      modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
    >
      {activeCategory && activeCategoryIndex >= 0 ? (
        <div className="w-full max-w-[calc(100vw-2rem)]">
          <CategoryReorderItem
            category={activeCategory}
            index={activeCategoryIndex}
            isDragging
            isOverlay
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
        items={categories.map((category) => category.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2" data-vaul-no-drag="">
          {categories.map((category, index) => (
            <SortableCategoryReorderItem
              key={category.id}
              category={category}
              disabled={disabled}
              index={index}
              isDragging={!disabled && activeId === category.id}
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

interface CategoryReorderDrawerProps {
  categories: CategoryDto[];
  hasChanges: boolean;
  isSaving: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  onReorder: (params: { activeId: string; overId: string }) => void;
  onSave: () => void;
  open: boolean;
}

export const CategoryReorderDrawer: React.FC<CategoryReorderDrawerProps> = ({
  categories,
  hasChanges,
  isSaving,
  onOpenChange,
  onReorder,
  onSave,
  open,
}) => {
  return (
    <AppDrawer open={open} onOpenChange={onOpenChange} dismissible={!isSaving}>
      <AppDrawer.Content className="w-full">
        <div className="flex min-h-0 flex-1 flex-col">
          <AppDrawer.Header
            title="Порядок категорий"
            description="Перетаскивайте категории за иконку слева и сохраните новый порядок кнопкой внизу."
            withCloseButton={!isSaving}
          />
          <hr />

          <DrawerScrollArea className="px-5 py-5">
            {categories.length > 0 ? (
              <CategoryReorderList
                categories={categories}
                disabled={isSaving}
                onReorder={onReorder}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Категории пока не добавлены.
              </p>
            )}
          </DrawerScrollArea>

          <AppDrawer.Footer className="border-t">
            <Button
              type="button"
              size="full"
              className="rounded-full"
              disabled={isSaving || !hasChanges}
              onClick={onSave}
            >
              {isSaving ? (
                <>
                  Сохраняем...
                  <Loader2 className="size-4 animate-spin" />
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </AppDrawer.Footer>
        </div>
      </AppDrawer.Content>
    </AppDrawer>
  );
};
