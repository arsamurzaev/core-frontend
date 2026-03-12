"use client";

import {
  CONTACT_FIELD_NAMES,
  type CatalogContactValues,
  normalizeContactValue,
} from "@/core/widgets/edit-catalog-drawer/model/edit-catalog-contacts";
import { type CatalogEditFormValues } from "@/core/widgets/edit-catalog-drawer/model/form-config";
import React from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";

export function useEditCatalogContactValues(
  form: UseFormReturn<CatalogEditFormValues>,
) {
  const watchedValues = useWatch({
    control: form.control,
    name: CONTACT_FIELD_NAMES,
  });

  const contactValues = React.useMemo(
    () =>
      CONTACT_FIELD_NAMES.reduce((acc, fieldName, index) => {
        acc[fieldName] =
          typeof watchedValues?.[index] === "string" ? watchedValues[index] : "";
        return acc;
      }, {} as CatalogContactValues),
    [watchedValues],
  );

  const hasContacts = React.useMemo(
    () =>
      Object.values(contactValues).some(
        (value) => normalizeContactValue(value).length > 0,
      ),
    [contactValues],
  );

  return {
    contactValues,
    hasContacts,
  };
}
