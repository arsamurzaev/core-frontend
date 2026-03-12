"use client";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Mic, Paperclip } from "lucide-react";

export function ShareDrawerConfirmContent() {
  return (
    <div className="relative mt-15 grid grid-cols-[auto_1fr_auto] gap-3 px-8 pb-5">
      <Button size="icon" variant="secondary" className="rounded-full">
        <Paperclip />
      </Button>

      <Button
        className="absolute -top-13 left-19 rounded-full shadow-[0_0_10px_8px]"
        variant="ghost"
        type="button"
      >
        Вставить
      </Button>

      <Input className="rounded-full" placeholder="Сообщение" readOnly />

      <Button size="icon" variant="secondary" className="rounded-full">
        <Mic />
      </Button>
    </div>
  );
}
