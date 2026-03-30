import { FORWARDED_HOST_HEADER, mutator } from "@/shared/api/client";
import type {
  CategoryDto,
  ProductWithAttributesDto,
} from "@/shared/api/generated/react-query";
import { resolveServerForwardedHost } from "@/shared/api/server/get-current-catalog";
import { buildStorefrontHomeDataCacheTag } from "@/shared/api/server/storefront-cache";
import { unstable_cache } from "next/cache";

interface HomePageData {
  categories: CategoryDto[];
  popularProducts: ProductWithAttributesDto[];
}

const STOREFRONT_HOME_DATA_REVALIDATE_SECONDS = 15;

export async function getHomePageDataServer(): Promise<HomePageData> {
  const forwardedHost = await resolveServerForwardedHost();

  const getCachedHomePageDataByHost = unstable_cache(
    async (): Promise<HomePageData> => {
      const headers = {
        [FORWARDED_HOST_HEADER]: forwardedHost,
      };

      const [categoriesResult, popularProductsResult] =
        await Promise.allSettled([
          mutator<CategoryDto[]>({
            url: "/category",
            method: "GET",
            headers,
          }),
          mutator<ProductWithAttributesDto[]>({
            url: "/product/cards/popular",
            method: "GET",
            headers,
          }),
        ]);

      return {
        categories:
          categoriesResult.status === "fulfilled" ? categoriesResult.value : [],
        popularProducts:
          popularProductsResult.status === "fulfilled"
            ? popularProductsResult.value
            : [],
      };
    },
    ["home-page-data-by-host", forwardedHost],
    {
      revalidate: STOREFRONT_HOME_DATA_REVALIDATE_SECONDS,
      tags: [buildStorefrontHomeDataCacheTag(forwardedHost)],
    },
  );

  return getCachedHomePageDataByHost();
}
