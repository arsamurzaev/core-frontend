import {
  type ProductIntegrationDto,
  ProductIntegrationDtoProvider,
} from "@/shared/api/generated/react-query";

interface ProductWithIntegration {
  integration: ProductIntegrationDto | null;
}

export function getMoySkladProductMarker(
  product: ProductWithIntegration | null | undefined,
): string | null {
  if (!isMoySkladProduct(product)) {
    return null;
  }

  return product?.integration?.externalId ?? null;
}

export function isMoySkladProduct(
  product: ProductWithIntegration | null | undefined,
): boolean {
  return product?.integration?.provider === ProductIntegrationDtoProvider.MOYSKLAD;
}
