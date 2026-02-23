import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Grid2X2, Search, SlidersVertical } from "lucide-react";
import React from "react";

interface Props {
  className?: string;
}

export const FilterBar: React.FC<Props> = ({ className }) => {
  const stickyRef = React.useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = React.useState(false);

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

  return (
    <div
      ref={stickyRef}
      className={cn(
        "sticky top-2 z-20 rounded-2xl p-2 transition-colors",
        isSticky && "bg-muted",
        className,
      )}
    >
      <div className="flex gap-5">
        <div className="shadow-custom relative w-full flex-1 rounded-full">
          <Input
            //   value={searchTerm}
            //   onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск"
            className={cn("h-10 rounded-full pr-10 pl-4")}
          />
          <Search
            className={cn("absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2")}
          />
        </div>
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
        >
          <SlidersVertical size={20} />
        </Button>
      </div>
    </div>
  );
};
