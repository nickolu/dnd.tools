"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { COPY_FEEDBACK_TIMEOUT_MS } from "@/components/copy-visible-names-action/constants";
import { useCopyText } from "@/components/copy-visible-names-action/hooks/use-copy-text";
import type { CopyVisibleNamesActionProps } from "@/components/copy-visible-names-action/types";
import { getCopyFeedbackLabel } from "@/components/copy-visible-names-action/utils/get-copy-feedback-label";

type CopyState = "idle" | "success" | "error";

export function CopyVisibleNamesAction({
  disabled = false,
  itemTypeLabel,
  names,
}: CopyVisibleNamesActionProps) {
  const copyText = useCopyText();
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const timeoutRef = useRef<number | null>(null);
  const normalizedNames = useMemo(
    () => names.map((name) => name.trim()).filter(Boolean),
    [names]
  );
  const canCopy = normalizedNames.length > 0 && !disabled;

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const queueReset = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setCopyState("idle");
    }, COPY_FEEDBACK_TIMEOUT_MS);
  };

  const feedbackLabel =
    copyState === "success"
      ? getCopyFeedbackLabel(itemTypeLabel, normalizedNames.length)
      : copyState === "error"
        ? "Unable to copy names."
        : "";

  return (
    <div className="flex items-center gap-2">
      <button
        className="admin-button-secondary typography-body-sm px-3 py-1"
        disabled={!canCopy}
        onClick={async () => {
          try {
            await copyText(normalizedNames.join("\n"));
            setCopyState("success");
          } catch {
            setCopyState("error");
          }

          queueReset();
        }}
        type="button"
      >
        Copy visible names
      </button>
      <p
        aria-live="polite"
        className="typography-body-sm text-muted"
        role="status"
      >
        {feedbackLabel}
      </p>
    </div>
  );
}
