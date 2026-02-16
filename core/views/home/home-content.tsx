import { PopularProductCarousel } from "@/core/widgets/popular-product-carousel/ui/popular-product-carousel";
import { Header } from "@/core/widgets/header/ui/header";
import { cn } from "@/shared/lib/utils";
import { ContentContainer } from "@/shared/ui/layout/content-container";
import React from "react";
import { BackgroundImage } from "./_ui/background-image";

interface Props {
  className?: string;
}

export const HomeContent: React.FC<Props> = ({ className }) => {
  return (
    <main className={cn("", className)}>
      <ContentContainer>
        <BackgroundImage />
        <div rel="content" className="px-2.5 space-y-8">
          <Header />
          <PopularProductCarousel />
        </div>
      </ContentContainer>
    </main>
  );
};
