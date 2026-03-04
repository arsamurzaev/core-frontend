import { type CatalogFilterQueryState } from "@/shared/lib/catalog-filter-query";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Grid2X2, Search, SlidersVertical } from "lucide-react";
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
  onFilterToggle?: (patch?: CatalogFilterValuePatch) => void;
}

export const FilterBar: React.FC<Props> = ({
  className,
  tab,
  bottomRow,
  searchTerm,
  onFilterToggle,
}) => {
  const stickyRef = React.useRef<HTMLDivElement>(null);
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

  const handleApplyFilters = React.useCallback(() => {
    onFilterToggle?.({
      searchTerm: searchValue,
    });
  }, [onFilterToggle, searchValue]);

  const handleSearchKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") {
        return;
      }

      handleApplyFilters();
    },
    [handleApplyFilters],
  );

  return (
    <div
      id="catalog-filter-bar"
      ref={stickyRef}
      className={cn(
        "sticky top-0 z-20 rounded-b-2xl p-0 transition-all",
        isSticky && "-mx-2.5 bg-white p-4 shadow-custom",
        className,
      )}
    >
      <div className="flex gap-5">
        {isSticky ? (
          tab
        ) : (
          <div className="shadow-custom relative w-full flex-1 rounded-full">
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Поиск"
              className={cn("h-10 rounded-full pr-10 pl-4")}
            />
            <Search
              className={cn(
                "absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2",
              )}
            />
          </div>
        )}
        <Button
          variant={"ghost"}
          // onClick={onToggle}
          className="shadow-custom flex h-10 w-10 items-center justify-center rounded-full"
          aria-label={"Переключить на сетку"}
        >
          <Grid2X2 size={20} />
        </Button>
        <Button
          variant={"ghost"}
          className={cn(
            "shadow-custom relative flex h-10 w-10 items-center justify-center rounded-full",
          )}
          onClick={handleApplyFilters}
        >
          <SlidersVertical size={20} />
        </Button>
      </div>
      {bottomRow ? <div className="mt-3">{bottomRow}</div> : null}
    </div>
  );
};
