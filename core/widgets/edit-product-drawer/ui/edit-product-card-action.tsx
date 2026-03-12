"use client";

import { EditProductDrawer } from "@/core/widgets/edit-product-drawer/ui/edit-product-drawer";
import { useSession } from "@/shared/providers/session-provider";
import { Button } from "@/shared/ui/button";
import { Pencil } from "lucide-react";
import React from "react";

interface EditProductCardActionProps {
  productId: string;
}

export const EditProductCardAction: React.FC<EditProductCardActionProps> = ({
  productId,
}) => {
  const { isAuthenticated } = useSession();
  const [open, setOpen] = React.useState(false);

  const handleTriggerClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
    },
    [],
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="absolute top-[5px] right-[5px] z-10 flex flex-col gap-2 opacity-60">
        <Button
          type="button"
          size="icon"
          onClick={handleTriggerClick}
          className="shadow-custom h-[30px] w-[30px] rounded-full border-0 bg-white hover:bg-white"
          aria-label="Редактировать товар"
        >
          <Pencil className="fill-muted-foreground size-4" />
        </Button>
      </div>

      <EditProductDrawer
        productId={productId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
};
