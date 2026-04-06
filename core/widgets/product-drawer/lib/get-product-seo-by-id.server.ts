import { FORWARDED_HOST_HEADER, mutator } from "@/shared/api/client";
import {
  SeoDtoEntityType,
  type SeoDto,
} from "@/shared/api/generated/react-query";
import { SeoControllerGetByEntityResponse } from "@/shared/api/generated/zod";
import { resolveServerForwardedHost } from "@/shared/api/server/get-current-catalog";
import { cookies } from "next/headers";

export async function getProductSeoByIdServer(
  productId: string,
): Promise<SeoDto | null> {
  try {
    const [cookieStore, forwardedHost] = await Promise.all([
      cookies(),
      resolveServerForwardedHost(),
    ]);
    const cookieHeader = cookieStore.toString();

    const response = await mutator<unknown>({
      url: `/seo/entity/${SeoDtoEntityType.PRODUCT}/${encodeURIComponent(productId)}`,
      method: "GET",
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        [FORWARDED_HOST_HEADER]: forwardedHost,
      },
    });

    const parsed = SeoControllerGetByEntityResponse.safeParse(response);
    if (!parsed.success) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}
