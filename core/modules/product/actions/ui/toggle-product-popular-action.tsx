"use client";

import { extractApiErrorMessage } from "@/shared/lib/api-errors";
import { invalidateProductQueries } from "@/core/modules/product/actions/model/invalidate-product-queries";
import { useProductControllerTogglePopular } from "@/shared/api/generated/react-query";
import { cn } from "@/shared/lib/utils";
import { useSession } from "@/shared/providers/session-provider";
import { Button } from "@/shared/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface ToggleProductPopularActionProps {
  productId: string;
  isPopular: boolean;
}

export const ToggleProductPopularAction: React.FC<
  ToggleProductPopularActionProps
> = ({ productId, isPopular }) => {
  const { isAuthenticated } = useSession();
  const queryClient = useQueryClient();
  const togglePopularMutation = useProductControllerTogglePopular();

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const promise = (async () => {
        await togglePopularMutation.mutateAsync({ id: productId });
        await invalidateProductQueries(queryClient);
      })();

      void toast.promise(promise, {
        loading: "Обновление товара...",
        success: "Товар успешно обновлен.",
        error: (error) => extractApiErrorMessage(error),
      });
    },
    [productId, queryClient, togglePopularMutation],
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={togglePopularMutation.isPending}
      onClick={handleClick}
      className="absolute bottom-[0px] left-[0px] h-fit w-fit p-0 hover:bg-transparent"
      aria-label={isPopular ? "Убрать из популярного" : "Добавить в популярное"}
    >
      <Star
        className={cn(
          "text-muted",
          isPopular && "fill-tertiary text-tertiary",
          togglePopularMutation.isPending && "animate-spin",
        )}
      />
    </Button>
  );
};
