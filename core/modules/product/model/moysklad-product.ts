import {
  type ProductIntegrationDto,
  ProductIntegrationDtoProvider,
} from "@/shared/api/generated/react-query";

interface ProductWithIntegration {
  integration: ProductIntegrationDto | null;
}

const INTEGRATION_PROVIDER_LABELS: Record<
  ProductIntegrationDtoProvider,
  string
> = {
  [ProductIntegrationDtoProvider.MOYSKLAD]: "МойСклад",
  [ProductIntegrationDtoProvider.IIKO]: "iiko",
};

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
  return (
    product?.integration?.provider === ProductIntegrationDtoProvider.MOYSKLAD
  );
}

export function isIikoProduct(
  product: ProductWithIntegration | null | undefined,
): boolean {
  return product?.integration?.provider === ProductIntegrationDtoProvider.IIKO;
}

export function isIntegratedProduct(
  product: ProductWithIntegration | null | undefined,
): boolean {
  return Boolean(product?.integration?.provider);
}

export function getProductIntegrationProviderLabel(
  product: ProductWithIntegration | null | undefined,
): string | null {
  const provider = product?.integration?.provider;
  if (!provider) return null;

  return INTEGRATION_PROVIDER_LABELS[provider] ?? provider;
}
