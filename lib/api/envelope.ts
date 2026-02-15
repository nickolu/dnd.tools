import { NextResponse } from "next/server";

export const API_ERROR_CODES = {
  FIREBASE_NOT_CONFIGURED: "FIREBASE_NOT_CONFIGURED",
  FORBIDDEN: "FORBIDDEN",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NOT_FOUND: "NOT_FOUND",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export type ApiSuccess<T> = {
  data: T;
  ok: true;
};

export type ApiError = {
  error: {
    code: ApiErrorCode;
    details?: unknown;
    message: string;
  };
  ok: false;
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiError;

export const jsonSuccess = <T>(
  data: T,
  status = 200,
  headers?: HeadersInit
) =>
  NextResponse.json<ApiSuccess<T>>(
    { data, ok: true },
    headers ? { headers, status } : { status }
  );

export const jsonError = (
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: unknown,
  headers?: HeadersInit
) =>
  NextResponse.json<ApiError>(
    {
      error: {
        code,
        details,
        message,
      },
      ok: false,
    },
    headers ? { headers, status } : { status }
  );
