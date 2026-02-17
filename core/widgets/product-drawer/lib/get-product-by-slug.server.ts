import { mutator } from "@/shared/api/client";
import type { ProductWithDetailsDto } from "@/shared/api/generated";
import { cookies } from "next/headers";

export async function getProductBySlugServer(
  slug: string,
): Promise<ProductWithDetailsDto | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    return await mutator<ProductWithDetailsDto>({
      url: `/product/slug/${encodeURIComponent(slug)}`,
      method: "GET",
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    });
  } catch {
    return null;
  }
}
