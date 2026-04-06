"use client";

import {
  buildCreateProductFormFields,
  CREATE_PRODUCT_FORM_FIELD_CLASS,
  CREATE_PRODUCT_FORM_LABEL_CLASS,
  type CreateProductFormValues,
} from "@/core/modules/product/editor/model/form-config";
import { sortAttributesByDisplayOrder } from "@/core/modules/product/editor/model/product-attributes";
import { CreateProductBrandField } from "@/core/modules/product/editor/ui/create-product-brand-field";
import { CreateProductCategoriesField } from "@/core/modules/product/editor/ui/create-product-categories-field";
import { CreateProductDiscountDateRangeField } from "@/core/modules/product/editor/ui/create-product-discount-date-range-field";
import { CreateProductDiscountLinkedField } from "@/core/modules/product/editor/ui/create-product-discount-linked-field";
import {
  type AttributeDto,
  AttributeDtoDataType,
  useBrandControllerGetAll,
  useCategoryControllerGetAll,
} from "@/shared/api/generated/react-query";

import { type DynamicFieldRenderProps } from "@/shared/ui/dynamic-form";
import React from "react";
import { type UseFormReturn } from "react-hook-form";

const DISCOUNT_ATTRIBUTE_KEYS = new Set([
  "discount",
  "discountedprice",
  "discountstartat",
  "discountendat",
]);

function normalizeAttributeKey(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function isDiscountAttribute(attribute: AttributeDto): boolean {
  return DISCOUNT_ATTRIBUTE_KEYS.has(normalizeAttributeKey(attribute.key));
}

export interface UseProductFormFieldsParams {
  form: UseFormReturn<CreateProductFormValues>;
  sourceAttributes: AttributeDto[] | null | undefined;
  isActive?: boolean;
  includeCategories?: boolean;
}

export function useProductFormFields({
  form,
  sourceAttributes,
  isActive = false,
  includeCategories = true,
}: UseProductFormFieldsParams) {
  const brandsQuery = useBrandControllerGetAll({
    query: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });
  const categoriesQuery = useCategoryControllerGetAll({
    query: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });

  const productAttributes = React.useMemo(
    () =>
      sortAttributesByDisplayOrder(
        (sourceAttributes ?? []).filter(
          (attribute) => !attribute.isHidden && !attribute.isVariantAttribute,
        ),
      ),
    [sourceAttributes],
  );

  const variantAttributes = React.useMemo(
    () =>
      sortAttributesByDisplayOrder(
        (sourceAttributes ?? []).filter(
          (attribute) =>
            !attribute.isHidden &&
            attribute.isVariantAttribute &&
            attribute.dataType === AttributeDtoDataType.ENUM,
        ),
      ),
    [sourceAttributes],
  );

  const discountAttributes = React.useMemo(
    () => productAttributes.filter((attribute) => isDiscountAttribute(attribute)),
    [productAttributes],
  );

  const brandOptions = React.useMemo(
    () =>
      [...(brandsQuery.data ?? [])]
        .sort((left, right) => left.name.localeCompare(right.name, "ru"))
        .map((brand) => ({
          label: brand.name,
          value: brand.id,
        })),
    [brandsQuery.data],
  );

  const categoryOptions = React.useMemo(
    () =>
      [...(categoriesQuery.data ?? [])]
        .sort((left, right) => left.name.localeCompare(right.name, "ru"))
        .map((category) => ({
          label: category.name,
          value: category.id,
        })),
    [categoriesQuery.data],
  );

  const hasDiscount = form.watch("hasDiscount");

  const discountAttributeIds = React.useMemo(
    () => discountAttributes.map((attribute) => attribute.id),
    [discountAttributes],
  );

  const visibleAttributes = React.useMemo(
    () =>
      hasDiscount
        ? productAttributes
        : productAttributes.filter((attribute) => !isDiscountAttribute(attribute)),
    [hasDiscount, productAttributes],
  );

  const baseFormFields = React.useMemo(
    () => {
      const customFields = [
        {
          name: "brandId",
          label: "Бренд",
          component: CreateProductBrandField,
          options: brandOptions,
          placeholder: "Выбрать бренд",
          hideError: true,
          orientation: "horizontal",
          labelClassName: CREATE_PRODUCT_FORM_LABEL_CLASS,
          className: CREATE_PRODUCT_FORM_FIELD_CLASS,
          layout: { colSpan: 2, order: 40 },
        },
        includeCategories
          ? {
              name: "categoryIds",
              label: "Категории",
              component: CreateProductCategoriesField,
              options: categoryOptions,
              placeholder: "Выбрать категорию",
              hideError: true,
              orientation: "horizontal",
              labelClassName: CREATE_PRODUCT_FORM_LABEL_CLASS,
              className: CREATE_PRODUCT_FORM_FIELD_CLASS,
              multiple: true,
              layout: { colSpan: 2, order: 50 },
            }
          : null,
        {
          name: "hasDiscount",
          label: "Есть скидка",
          kind: "checkbox",
          hideError: true,
          orientation: "horizontal",
          className: "items-center",
          layout: { colSpan: 2, order: 70 },
        },
      ].filter(Boolean);

      return buildCreateProductFormFields(
        visibleAttributes,
        customFields as ReturnType<typeof buildCreateProductFormFields>[number][],
      );
    },
    [brandOptions, categoryOptions, includeCategories, visibleAttributes],
  );

  const formFields = React.useMemo(() => {
    const discountAttribute =
      productAttributes.find((a) => normalizeAttributeKey(a.key) === "discount") ?? null;
    const discountedPriceAttribute =
      productAttributes.find((a) => normalizeAttributeKey(a.key) === "discountedprice") ?? null;
    const discountStartAttribute =
      productAttributes.find((a) => normalizeAttributeKey(a.key) === "discountstartat") ?? null;
    const discountEndAttribute =
      productAttributes.find((a) => normalizeAttributeKey(a.key) === "discountendat") ?? null;

    const discountFieldName = discountAttribute
      ? `attributes.${discountAttribute.id}`
      : null;
    const discountedPriceFieldName = discountedPriceAttribute
      ? `attributes.${discountedPriceAttribute.id}`
      : null;
    const discountStartFieldName = discountStartAttribute
      ? `attributes.${discountStartAttribute.id}`
      : null;
    const discountEndFieldName = discountEndAttribute
      ? `attributes.${discountEndAttribute.id}`
      : null;
    const discountEndAttributeId = discountEndAttribute?.id ?? null;

    const hasRangePair = Boolean(
      discountStartFieldName && discountEndFieldName,
    );

    if (!discountFieldName && !discountedPriceFieldName && !hasRangePair) {
      return baseFormFields;
    }

    return baseFormFields
      .filter((field) => {
        if (!discountStartFieldName || !discountEndFieldName) {
          return true;
        }

        return String(field.name) !== discountEndFieldName;
      })
      .map((field) => {
        const fieldName = String(field.name);

        if (discountFieldName && fieldName === discountFieldName) {
          return {
            ...field,
            component: (props: DynamicFieldRenderProps<CreateProductFormValues>) =>
              React.createElement(CreateProductDiscountLinkedField, {
                ...props,
                mode: "discount",
                relatedAttributeId: discountedPriceAttribute?.id,
              }),
          };
        }

        if (
          discountStartFieldName &&
          discountEndFieldName &&
          discountEndAttributeId &&
          fieldName === discountStartFieldName
        ) {
          return {
            ...field,
            component: (props: DynamicFieldRenderProps<CreateProductFormValues>) =>
              React.createElement(CreateProductDiscountDateRangeField, {
                ...props,
                relatedAttributeId: discountEndAttributeId,
              }),
          };
        }

        if (discountedPriceFieldName && fieldName === discountedPriceFieldName) {
          return {
            ...field,
            component: (props: DynamicFieldRenderProps<CreateProductFormValues>) =>
              React.createElement(CreateProductDiscountLinkedField, {
                ...props,
                mode: "discounted-price",
                relatedAttributeId: discountAttribute?.id,
              }),
          };
        }

        return field;
      });
  }, [baseFormFields, productAttributes]);

  React.useEffect(() => {
    if (!isActive) {
      return;
    }

    const currentValues = form.getValues("attributes");
    const nextValues = { ...currentValues };
    let changed = false;

    for (const attribute of productAttributes) {
      if (
        attribute.dataType === AttributeDtoDataType.BOOLEAN &&
        nextValues[attribute.id] === undefined
      ) {
        nextValues[attribute.id] = false;
        changed = true;
      }
    }

    if (changed) {
      form.setValue("attributes", nextValues);
    }
  }, [form, isActive, productAttributes]);

  React.useEffect(() => {
    if (hasDiscount || discountAttributeIds.length === 0) {
      return;
    }

    const currentValues = form.getValues("attributes");
    const nextValues = { ...currentValues };
    let changed = false;

    for (const attributeId of discountAttributeIds) {
      if (nextValues[attributeId] !== null) {
        nextValues[attributeId] = null;
        changed = true;
      }
    }

    if (changed) {
      form.setValue("attributes", nextValues);
    }
  }, [discountAttributeIds, form, hasDiscount]);

  return {
    formFields,
    productAttributes,
    variantAttributes,
    visibleAttributes,
  };
}
