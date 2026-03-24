import { type FilePreviewEntry } from "@/core/modules/product/editor/model/types";
import React from "react";

export function useFilePreviewEntries(files: File[]): FilePreviewEntry[] {
  const [filePreviewEntries, setFilePreviewEntries] = React.useState<
    FilePreviewEntry[]
  >([]);
  const previewCacheRef = React.useRef<
    Map<File, Omit<FilePreviewEntry, "file">>
  >(new Map());
  const previewKeySequenceRef = React.useRef(0);

  React.useEffect(() => {
    const cache = previewCacheRef.current;
    const nextEntries = files.map((file) => {
      const cached = cache.get(file);
      if (cached) {
        return { file, ...cached };
      }

      const created = {
        key: `product-image-${previewKeySequenceRef.current++}`,
        previewUrl: URL.createObjectURL(file),
      };
      cache.set(file, created);
      return { file, ...created };
    });

    const activeFiles = new Set(files);
    for (const [file, cached] of Array.from(cache.entries())) {
      if (!activeFiles.has(file)) {
        URL.revokeObjectURL(cached.previewUrl);
        cache.delete(file);
      }
    }

    setFilePreviewEntries(nextEntries);
  }, [files]);

  React.useEffect(
    () => () => {
      for (const cached of previewCacheRef.current.values()) {
        URL.revokeObjectURL(cached.previewUrl);
      }
      previewCacheRef.current.clear();
    },
    [],
  );

  return filePreviewEntries;
}
