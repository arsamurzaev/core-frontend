import { type UploadState } from "@/core/modules/product/editor/model/types";

export const MAX_PRODUCT_IMAGES = 12;

export const IDLE_PRODUCT_IMAGE_UPLOAD_STATE: UploadState = {
  phase: "idle",
  progress: 0,
  message: "",
};

export const REQUIRED_PRODUCT_IMAGE_CROP_MESSAGE =
  "Сначала последовательно обрежьте все фотографии (1, 2, 3 ...).";

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getProductImageCropperCopy(params: {
  isEditingSingle: boolean;
  isInitialCropRequired: boolean;
}): {
  applyLabel: string;
  description: string;
  mode: "required-sequential" | "optional";
  title: string;
} {
  const { isEditingSingle, isInitialCropRequired } = params;

  if (isInitialCropRequired && !isEditingSingle) {
    return {
      applyLabel: "Обрезать и далее",
      description:
        "Сначала обрежьте фото 1, затем 2 и далее. Для первичного добавления это обязательный шаг.",
      mode: "required-sequential",
      title: "Обрежьте фотографии по очереди",
    };
  }

  if (isEditingSingle) {
    return {
      applyLabel: "Применить обрезку",
      description:
        "Изменения применятся только к выбранной фотографии.",
      mode: "optional",
      title: "Редактирование фотографии",
    };
  }

  return {
    applyLabel: "Применить обрезку",
    description:
      "Подготовьте одну или несколько фотографий в формате 3:4 перед загрузкой.",
    mode: "optional",
    title: "Обрезка фотографий товара",
  };
}
