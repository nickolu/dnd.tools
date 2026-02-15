import { useCallback } from "react";

function fallbackCopyText(text: string): boolean {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textArea);
  }
}

export function useCopyText() {
  return useCallback(async (text: string): Promise<void> => {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.clipboard?.writeText === "function"
    ) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const copied = fallbackCopyText(text);
    if (!copied) {
      throw new Error("Copy command was not supported.");
    }
  }, []);
}
