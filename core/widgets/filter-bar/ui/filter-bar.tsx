import { useProductCardViewMode } from "@/core/modules/product/model/use-product-card-view-mode";
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
      className={cn(
        "sticky top-0 z-20 rounded-b-2xl border border-transparent bg-white",
        "transition-[margin,padding,border-color,border-radius,box-shadow,background-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isSticky &&
          "-mx-2.5 translate-y-0 rounded-b-3xl border-black/5 bg-white/95 px-4 py-3 shadow-custom backdrop-blur",
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
                  className="shadow-custom flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95"
                  aria-label="Открыть поиск"
                >
                  <Search size={20} />
                </Button>
              </DialogTrigger>
              <DialogContent
                showCloseButton={false}
                className="top-4 translate-y-0 rounded-full border-none bg-transparent p-0 px-2 shadow-none sm:max-w-[calc(100%-1rem)]"
              >
                <DialogTitle className="sr-only">Поиск по каталогу</DialogTitle>
                <DialogDescription className="sr-only">
                  Введите запрос для поиска товаров.
                </DialogDescription>
                <CatalogSearchField
                  value={searchValue}
                  autoFocus
                  className="bg-white"
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
            className="shadow-custom flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95"
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
              className="shadow-custom relative flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95"
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
