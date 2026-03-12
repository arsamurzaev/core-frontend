import { normalizeSingleLineText } from "@/core/widgets/create-product-drawer/lib/select-field-utils";
import {
  type CategoryImageUploadState,
} from "@/core/widgets/create-product-drawer/lib/upload-category-image";

export const MAX_CATEGORY_NAME_LENGTH = 35;
export const MAX_CATEGORY_DESCRIPTOR_LENGTH = 37;

interface CategoryEditorDraftValues {
  name: string;
  descriptor: string;
}

type ParseCategoryEditorDraftResult =
  | {
      success: true;
      values: CategoryEditorDraftValues;
    }
  | {
      success: false;
      errorMessage: string;
    };

export function parseCategoryEditorDraft(
  values: CategoryEditorDraftValues,
): ParseCategoryEditorDraftResult {
  const normalizedValues = {
    name: normalizeSingleLineText(values.name),
    descriptor: normalizeSingleLineText(values.descriptor),
  };

  if (!normalizedValues.name) {
    return {
      success: false,
      errorMessage:
        "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438.",
    };
  }

  if (normalizedValues.name.length > MAX_CATEGORY_NAME_LENGTH) {
    return {
      success: false,
      errorMessage:
        `\u041c\u0430\u043a\u0441\u0438\u043c\u0443\u043c ${MAX_CATEGORY_NAME_LENGTH} ` +
        "\u0441\u0438\u043c\u0432\u043e\u043b\u043e\u0432.",
    };
  }

  if (normalizedValues.descriptor.length > MAX_CATEGORY_DESCRIPTOR_LENGTH) {
    return {
      success: false,
      errorMessage:
        `\u041c\u0430\u043a\u0441\u0438\u043c\u0443\u043c ${MAX_CATEGORY_DESCRIPTOR_LENGTH} ` +
        "\u0441\u0438\u043c\u0432\u043e\u043b\u043e\u0432.",
    };
  }

  return {
    success: true,
    values: normalizedValues,
  };
}

export function toCategoryUploadErrorState(
  current: CategoryImageUploadState,
  message: string,
): CategoryImageUploadState {
  if (current.phase === "idle") {
    return current;
  }

  return {
    phase: "error",
    progress: current.progress,
    message,
  };
}
