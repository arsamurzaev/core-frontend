"use client";

import { useCart } from "@/core/modules/cart";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import React from "react";

export const HallTableGuestNameDialog: React.FC = () => {
  const { hallTableSession } = useCart();
  const [name, setName] = React.useState("");
  const normalizedName = name.trim();

  React.useEffect(() => {
    if (hallTableSession.needsGuestName) {
      setName(hallTableSession.guestName ?? "");
    }
  }, [hallTableSession.guestName, hallTableSession.needsGuestName]);

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!normalizedName) {
        return;
      }

      hallTableSession.submitGuestName(normalizedName);
    },
    [hallTableSession, normalizedName],
  );

  return (
    <Dialog open={hallTableSession.needsGuestName}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Как вас зовут?</DialogTitle>
            <DialogDescription>
              Имя появится в общей корзине стола рядом с вашими блюдами.
            </DialogDescription>
          </DialogHeader>

          <Input
            autoFocus
            maxLength={120}
            onChange={(event) => setName(event.target.value)}
            placeholder="Например, Дени"
            value={name}
          />

          <DialogFooter>
            <Button
              className="w-full justify-center"
              disabled={!normalizedName}
              size="full"
              type="submit"
            >
              Продолжить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
