import { mutator } from "@/shared/api/client";
import type { ProductWithDetailsDto } from "@/shared/api/generated";
import { ProductControllerGetBySlugResponse } from "@/shared/api/generated/zod";
import { cookies } from "next/headers";

export async function getProductBySlugServer(
  slug: string,
): Promise<ProductWithDetailsDto | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await mutator<unknown>({
      url: `/product/slug/${encodeURIComponent(slug)}`,
      method: "GET",
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    });

    const parsed = ProductControllerGetBySlugResponse.safeParse(response);
    if (!parsed.success) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}
