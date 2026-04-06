"use client";
import { cn } from "@/shared/lib/utils";
import { useCatalog } from "@/shared/providers/catalog-provider";
import { AspectRatio } from "@/shared/ui/aspect-ratio";
import Image from "next/image";
import React from "react";

interface Props {
  className?: string;
}

export const BackgroundImage: React.FC<Props> = ({ className }) => {
  const catalog = useCatalog();

  if (!catalog) {
    return null;
  }

  const bgMedia = catalog.config?.bgMedia;

  return (
    <div className={cn(className)}>
      <AspectRatio ratio={4 / 1}>
        <Image
          src={bgMedia?.url || "/default-bg.png"}
          fill
          sizes="100vw"
          priority
          className="rounded-b-md object-cover"
          alt=""
          unoptimized={Boolean(bgMedia?.url)}
        />
      </AspectRatio>
    </div>
  );
};
