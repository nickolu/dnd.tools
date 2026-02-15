import { API_ERROR_CODES, jsonError } from "@/lib/api/envelope";

const getErrorField = (error: unknown, field: "code" | "message") => {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  return Reflect.get(error, field);
};

const getErrorCode = (error: unknown): string => {
  const code = getErrorField(error, "code");

  if (typeof code === "number") {
    return String(code);
  }

  if (typeof code === "string") {
    return code.toLowerCase();
  }

  return "";
};

const getErrorMessage = (error: unknown): string => {
  const message = getErrorField(error, "message");

  return typeof message === "string" ? message.toLowerCase() : "";
};

const isQuotaError = (error: unknown) => {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);

  return (
    code === "8" ||
    code.includes("resource_exhausted") ||
    code.includes("resource-exhausted") ||
    message.includes("quota exceeded") ||
    message.includes("resource_exhausted")
  );
};

const isUnavailableError = (error: unknown) => {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);

  return (
    code === "14" ||
    code.includes("unavailable") ||
    code.includes("deadline_exceeded") ||
    code.includes("deadline-exceeded") ||
    message.includes("deadline exceeded") ||
    message.includes("service unavailable")
  );
};

export const jsonFirestoreError = (error: unknown, fallbackMessage: string) => {
  if (isQuotaError(error)) {
    return jsonError(
      API_ERROR_CODES.QUOTA_EXCEEDED,
      "Firestore quota exceeded. Please retry shortly.",
      429
    );
  }

  if (isUnavailableError(error)) {
    return jsonError(
      API_ERROR_CODES.SERVICE_UNAVAILABLE,
      "Firestore is temporarily unavailable. Please retry shortly.",
      503
    );
  }

  return jsonError(API_ERROR_CODES.INTERNAL_ERROR, fallbackMessage, 500);
};
