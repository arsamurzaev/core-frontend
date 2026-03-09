import { useProductCardViewMode } from "@/core/modules/product/model/use-product-card-view-mode";
import { type CatalogFilterQueryState } from "@/shared/lib/catalog-filter-query";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import {
  Grid2X2,
  Search,
  SlidersVertical,
  StretchHorizontal,
} from "lucide-react";
import React, { ReactNode } from "react";

type CatalogFilterValuePatch = Partial<
  Pick<
    CatalogFilterQueryState,
    | "categories"
    | "brands"
    | "isPopular"
    | "isDiscount"
    | "searchTerm"
    | "minPrice"
    | "maxPrice"
  >
>;

interface Props {
  className?: string;
  tab?: ReactNode;
  bottomRow?: ReactNode;
  searchTerm?: string;
  filterAction?: ReactNode;
  onFilterToggle?: (patch?: CatalogFilterValuePatch) => void;
}

interface CatalogSearchFieldProps {
  value: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

const SEARCH_SYNC_DELAY_MS = 400;

const normalizeSearchValue = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed || undefined;
};

const CatalogSearchField: React.FC<CatalogSearchFieldProps> = ({
  value,
  className,
  inputClassName,
  autoFocus = false,
  onChange,
  onSubmit,
}) => {
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") {
        return;
      }

      onSubmit();
    },
    [onSubmit],
  );

  return (
    <div
      className={cn(
        "shadow-custom relative w-full flex-1 rounded-full",
        className,
      )}
    >
      <Input
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Поиск"
        aria-label="Поиск"
        className={cn("h-10 rounded-full pr-11 pl-4", inputClassName)}
      />
      <button
        type="button"
        onClick={onSubmit}
        aria-label="Применить поиск"
        className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded-full p-0.5"
      >
        <Search className="h-5 w-5" />
      </button>
    </div>
  );
};

export const FilterBar: React.FC<Props> = ({
  className,
  tab,
  bottomRow,
  searchTerm,
  filterAction,
  onFilterToggle,
}) => {
  const { isDetailed, toggleMode } = useProductCardViewMode();
  const stickyRef = React.useRef<HTMLDivElement>(null);
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [isSticky, setIsSticky] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState(searchTerm ?? "");

  React.useEffect(() => {
    const stickyTopOffset = 8;

    const updateStickyState = () => {
      const node = stickyRef.current;
      if (!node) {
        return;
      }

      const top = node.getBoundingClientRect().top;
      setIsSticky(top <= stickyTopOffset);
    };

    updateStickyState();

    window.addEventListener("scroll", updateStickyState, { passive: true });
    window.addEventListener("resize", updateStickyState);

    return () => {
      window.removeEventListener("scroll", updateStickyState);
      window.removeEventListener("resize", updateStickyState);
    };
  }, []);

  React.useEffect(() => {
    setSearchValue(searchTerm ?? "");
  }, [searchTerm]);

  const clearSearchSyncTimeout = React.useCallback(() => {
    if (searchTimeoutRef.current === null) {
      return;
    }

    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = null;
  }, []);

  const handleApplyFilters = React.useCallback(() => {
    clearSearchSyncTimeout();

    onFilterToggle?.({
      searchTerm: normalizeSearchValue(searchValue),
    });
  }, [clearSearchSyncTimeout, onFilterToggle, searchValue]);

  React.useEffect(() => {
    clearSearchSyncTimeout();

    searchTimeoutRef.current = setTimeout(() => {
      searchTimeoutRef.current = null;

      if (
        normalizeSearchValue(searchTerm ?? "") ===
        normalizeSearchValue(searchValue)
      ) {
        return;
      }

      onFilterToggle?.({
        searchTerm: normalizeSearchValue(searchValue),
      });
    }, SEARCH_SYNC_DELAY_MS);

    return clearSearchSyncTimeout;
  }, [clearSearchSyncTimeout, onFilterToggle, searchTerm, searchValue]);

  return (
    <div
      id="catalog-filter-bar"
      ref={stickyRef}
      className={cn(
        "sticky top-0 z-20 bg-white rounded-b-2xl p-0 transition-all",
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
        {filterAction ? (
          <div className="shrink-0">{filterAction}</div>
        ) : (
          <Button
            variant="ghost"
            className={cn(
              "shadow-custom relative flex h-10 w-10 items-center justify-center rounded-full",
            )}
            onClick={handleApplyFilters}
          >
            <SlidersVertical size={20} />
          </Button>
        )}
      </div>
      {bottomRow ? <div className="mt-3">{bottomRow}</div> : null}
    </div>
  );
};
