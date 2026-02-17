"use client";

import { Skeleton } from "@/shared/ui/skeleton";
import dynamic from "next/dynamic";

const HomeContentDynamic = dynamic(
  () => import("./home-content").then((module) => module.HomeContent),
  {
    ssr: false,
    loading: () => (
      <main>
        <div className="px-2.5 space-y-8 py-6">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      </main>
    ),
  },
);

export function HomeContentDeferred() {
  return <HomeContentDynamic />;
}
