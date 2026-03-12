"use client";

import {
  CONTACT_ICON_BY_NAME,
  type CatalogContactValues,
  normalizeContactValue,
} from "@/core/widgets/edit-catalog-drawer/model/edit-catalog-contacts";
import { CATALOG_CONTACT_FIELDS } from "@/core/widgets/edit-catalog-drawer/model/form-config";
import React from "react";

type EditCatalogContactIconsPreviewProps = {
  values: CatalogContactValues;
};

export const EditCatalogContactIconsPreview: React.FC<
  EditCatalogContactIconsPreviewProps
> = ({ values }) => {
  const activeFields = CATALOG_CONTACT_FIELDS.filter(
    (field) => normalizeContactValue(values[field.name]).length > 0,
  );

  if (activeFields.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">Добавить контакты</span>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      {activeFields.map((field) => {
        const Icon = CONTACT_ICON_BY_NAME[field.name];

        return (
          <span
            key={field.name}
            className="text-muted-foreground inline-flex items-center justify-center"
            title={field.label}
          >
            <Icon className="size-[18px]" />
          </span>
        );
      })}
    </span>
  );
};
