export type AttributeFormValue = string | boolean | null;

export type UploadPhase = "idle" | "uploading" | "processing" | "done" | "error";

export interface UploadState {
  phase: UploadPhase;
  progress: number;
  message: string;
}

export interface FilePreviewEntry {
  file: File;
  key: string;
  previewUrl: string;
}
