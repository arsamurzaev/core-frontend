import { useProductCardViewMode } from "@/core/modules/product";
import {
  type CatalogFilterValuePatch,
  useFilterBar,
} from "@/core/widgets/filter-bar/model/use-filter-bar";
import { CatalogSearchField } from "@/core/widgets/filter-bar/ui/catalog-search-field";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  Grid2X2,
  Search,
  SlidersVertical,
  StretchHorizontal,
} from "lucide-react";
import React, { type ReactNode } from "react";

interface Props {
  className?: string;
  tab?: ReactNode;
  bottomRow?: ReactNode;
  searchTerm?: string;
  filterAction?: ReactNode;
  hideFilter?: boolean;
  isFilterActive?: boolean;
  stickySearchMode?: "dialog" | "inline";
  onFilterToggle?: (patch?: CatalogFilterValuePatch) => void;
}

export const FilterBar: React.FC<Props> = ({
  className,
  tab,
  bottomRow,
  searchTerm,
  filterAction,
  hideFilter,
  isFilterActive = false,
  stickySearchMode = "dialog",
  onFilterToggle,
}) => {
  const { isDetailed, toggleMode } = useProductCardViewMode();
  const stableHeightRef = React.useRef(120);
  const {
    handleApplyFilters,
    isSticky,
    searchValue,
    setSearchValue,
    stickyRef,
  } = useFilterBar({
    onFilterToggle,
    searchTerm,
  });
  const shouldUseFilteredStickyLayout = isSticky && isFilterActive;

  React.useLayoutEffect(() => {
    const node = stickyRef.current;

    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }

    const updateHeight = () => {
      stableHeightRef.current = Math.max(
        stableHeightRef.current,
        Math.ceil(node.getBoundingClientRect().height),
      );
      document.documentElement.style.setProperty(
        "--catalog-filter-bar-height",
        `${stableHeightRef.current}px`,
      );
    };
    const observer = new ResizeObserver(updateHeight);

    updateHeight();
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [stickyRef]);

  return (
    <div
      id="catalog-filter-bar"
      ref={stickyRef}
      style={{ minHeight: "var(--catalog-filter-bar-height, 120px)" }}
      className={cn(
        "sticky top-0 z-30 rounded-b-panel border border-transparent bg-surface-base",
        "transition-[margin,padding,border-color,border-radius,box-shadow,background-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isSticky &&
          "-mx-2.5 translate-y-0 rounded-b-panel border-line-subtle bg-surface-base/95 px-4 py-3 shadow-surface backdrop-blur",
        className,
      )}
    >
      <div
        className={cn(
          "flex gap-5 transition-[gap,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isSticky && "translate-y-0",
          shouldUseFilteredStickyLayout && "gap-2",
        )}
      >
        {isSticky &&
        stickySearchMode === "dialog" &&
        !shouldUseFilteredStickyLayout ? (
          <>
            {tab}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex h-10 w-10 items-center justify-center rounded-pill bg-surface-base shadow-surface transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95"
                  aria-label="Открыть поиск"
                >
                  <Search size={20} />
                </Button>
              </DialogTrigger>
              <DialogContent
                showCloseButton={false}
                className="top-4 translate-y-0 rounded-pill border-none bg-transparent p-0 px-2 shadow-none sm:max-w-[calc(100%-1rem)]"
              >
                <DialogTitle className="sr-only">Поиск по каталогу</DialogTitle>
                <DialogDescription className="sr-only">
                  Введите запрос для поиска товаров.
                </DialogDescription>
                <CatalogSearchField
                  value={searchValue}
                  autoFocus
                  className="bg-surface-base"
                  onChange={setSearchValue}
                  onSubmit={handleApplyFilters}
                />
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <CatalogSearchField
            value={searchValue}
            className={cn(shouldUseFilteredStickyLayout && "min-w-0")}
            onChange={setSearchValue}
            onSubmit={handleApplyFilters}
          />
        )}

        {!shouldUseFilteredStickyLayout ? (
          <Button
            variant="ghost"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-pill bg-surface-base shadow-surface transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95",
              isFilterActive && "hidden sm:flex",
            )}
            aria-label={
              isDetailed ? "Переключить на сетку" : "Переключить на список"
            }
            onClick={toggleMode}
          >
            <Grid2X2 size={20} className={cn(isDetailed && "hidden")} />
            <StretchHorizontal
              size={20}
              className={cn(!isDetailed && "hidden")}
            />
          </Button>
        ) : null}

        {!hideFilter &&
          (filterAction ? (
            <div className="shrink-0">{filterAction}</div>
          ) : (
            <Button
              variant="ghost"
              className="relative flex h-10 w-10 items-center justify-center rounded-pill bg-surface-base shadow-surface transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95"
              onClick={handleApplyFilters}
            >
              <SlidersVertical size={20} />
            </Button>
          ))}
      </div>

      {bottomRow ? (
        <div
          className={cn(
            "mt-3 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isSticky ? "translate-y-0 opacity-100" : "translate-y-1 opacity-95",
          )}
        >
          {bottomRow}
        </div>
      ) : null}
    </div>
  );
};
