import type {
  BrandDto,
  CategoryDto,
  ProductTypeDto,
} from "@/shared/api/generated/react-query";
import type { FieldOption } from "@/shared/ui/dynamic-form";

function sortByName<TItem extends { name: string }>(items: TItem[]): TItem[] {
  return [...items].sort((left, right) =>
    left.name.localeCompare(right.name, "ru"),
  );
}

export function buildBrandOptions(
  brands: BrandDto[] | null | undefined,
  enabled: boolean,
): FieldOption[] {
  if (!enabled) {
    return [];
  }

  return sortByName(brands ?? []).map((brand) => ({
    label: brand.name,
    value: brand.id,
  }));
}

export function buildCategoryOptions(
  categories: CategoryDto[] | null | undefined,
): FieldOption[] {
  return sortByName(categories ?? []).map((category) => ({
    label: category.name,
    value: category.id,
  }));
}

export function buildProductTypeOptions(
  productTypes: ProductTypeDto[] | null | undefined,
): FieldOption[] {
  return sortByName(
    (productTypes ?? []).filter(
      (productType) => productType.isActive && !productType.isArchived,
    ),
  ).map((productType) => ({
    label: productType.name,
    value: productType.id,
    description: productType.description ?? undefined,
  }));
}
