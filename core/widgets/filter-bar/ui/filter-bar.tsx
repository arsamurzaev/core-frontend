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
  onFilterToggle?: (patch?: CatalogFilterValuePatch) => void;
}

export const FilterBar: React.FC<Props> = ({
  className,
  tab,
  bottomRow,
  searchTerm,
  filterAction,
  hideFilter,
  onFilterToggle,
}) => {
  const { isDetailed, toggleMode } = useProductCardViewMode();
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

  return (
    <div
      id="catalog-filter-bar"
      ref={stickyRef}
      className={cn(
        "sticky top-0 z-20 rounded-b-2xl bg-white p-0 transition-all",
        isSticky && "-mx-2.5 p-4 shadow-custom",
        className,
      )}
    >
      <div className="flex gap-5">
        {isSticky ? (
          <>
            {tab}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="shadow-custom flex h-10 w-10 items-center justify-center rounded-full"
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
            onChange={setSearchValue}
            onSubmit={handleApplyFilters}
          />
        )}

        <Button
          variant="ghost"
          className="shadow-custom flex h-10 w-10 items-center justify-center rounded-full"
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

        {!hideFilter && (filterAction ? (
          <div className="shrink-0">{filterAction}</div>
        ) : (
          <Button
            variant="ghost"
            className="shadow-custom relative flex h-10 w-10 items-center justify-center rounded-full"
            onClick={handleApplyFilters}
          >
            <SlidersVertical size={20} />
          </Button>
        ))}
      </div>

      {bottomRow ? <div className="mt-3">{bottomRow}</div> : null}
    </div>
  );
};
