export async function copyTextToClipboard(value: string): Promise<void> {
  if (!value) {
    return;
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Не удалось скопировать ссылку");
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();

  try {
    const isCopied = document.execCommand("copy");
    if (!isCopied) {
      throw new Error("Не удалось скопировать ссылку");
    }
  } finally {
    document.body.removeChild(textArea);
  }
}
