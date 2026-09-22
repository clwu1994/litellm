import type { ParseKeys } from "i18next";
import type { ReactNode } from "react";
import { toast as sonner } from "sonner";
import i18n from "@/i18n/bootstrapI18n";
import { ApiError, deriveErrorMessage, unwrapProxyErrorMessage } from "@/lib/http/client";

// fromError has 253 importers, many of them non-React helpers, so it resolves the title from the
// i18n instance at call time instead of taking a `t`. Toasts are created in event handlers and
// catch blocks, never during render, so a language switch applies to the next toast.

export type ToastKind = "success" | "info" | "warning" | "error";

export type ToastOptions = {
  readonly description?: ReactNode;
  readonly durationMs?: number;
};

type ErrorFacts = {
  readonly status: number | undefined;
  readonly proxyType: string | undefined;
  readonly text: string;
};

type ErrorTitle = {
  readonly key: ParseKeys<"common">;
  readonly warning: boolean;
};

const DEFAULT_DURATION_MS: Readonly<Record<ToastKind, number>> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: 6000,
};

const BUDGET_EXCEEDED: ErrorTitle = { key: "toastTitles.budgetExceeded", warning: true };
const RATE_LIMIT_EXCEEDED: ErrorTitle = { key: "toastTitles.rateLimitExceeded", warning: true };
const SERVICE_UNAVAILABLE: ErrorTitle = { key: "toastTitles.serviceUnavailable", warning: false };
const AUTHENTICATION_ERROR: ErrorTitle = { key: "toastTitles.authenticationError", warning: false };
const ACCESS_DENIED: ErrorTitle = { key: "toastTitles.accessDenied", warning: false };
const NOT_FOUND: ErrorTitle = { key: "toastTitles.notFound", warning: false };
const VALIDATION_ERROR: ErrorTitle = { key: "toastTitles.validationError", warning: false };
const REQUEST_ERROR: ErrorTitle = { key: "toastTitles.requestError", warning: false };
const ALREADY_EXISTS: ErrorTitle = { key: "toastTitles.alreadyExists", warning: false };
const SERVER_ERROR: ErrorTitle = { key: "toastTitles.serverError", warning: false };
const GENERIC_ERROR: ErrorTitle = { key: "toastTitles.error", warning: false };

const PROXY_TYPE_TITLES: Readonly<Record<string, ErrorTitle>> = {
  budget_exceeded: BUDGET_EXCEEDED,
  no_db_connection: SERVICE_UNAVAILABLE,
  expired_key: AUTHENTICATION_ERROR,
  token_not_found_in_db: AUTHENTICATION_ERROR,
  team_member_permission_error: ACCESS_DENIED,
  not_found_error: NOT_FOUND,
  validation_error: VALIDATION_ERROR,
  bad_request_error: REQUEST_ERROR,
  team_member_already_in_team: ALREADY_EXISTS,
};

const STATUS_TITLES: Readonly<Record<number, ErrorTitle>> = {
  400: REQUEST_ERROR,
  401: AUTHENTICATION_ERROR,
  403: ACCESS_DENIED,
  404: NOT_FOUND,
  409: ALREADY_EXISTS,
  422: VALIDATION_ERROR,
  429: RATE_LIMIT_EXCEEDED,
  503: SERVICE_UNAVAILABLE,
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === "object" ? (value as Record<string, unknown>) : undefined;

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

const toStatus = (value: unknown): number | undefined => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && /^\d{3}$/.test(value)) return Number(value);
  return undefined;
};

const proxyEnvelope = (payload: unknown): Record<string, unknown> | undefined => {
  const record = asRecord(payload);
  return asRecord(record?.error) ?? record;
};

const proxyTypeOf = (payload: unknown): string | undefined => {
  const type = proxyEnvelope(payload)?.type;
  return typeof type === "string" ? type : undefined;
};

const EMBEDDED_JSON = /\{[\s\S]*\}/;

const describeText = (text: string): ErrorFacts => {
  const embedded = text.match(EMBEDDED_JSON)?.[0];
  const parsed = embedded === undefined ? undefined : parseJson(embedded);
  if (embedded === undefined || asRecord(parsed) === undefined) {
    return { status: undefined, proxyType: undefined, text: unwrapProxyErrorMessage(text) };
  }
  return {
    status: toStatus(proxyEnvelope(parsed)?.code),
    proxyType: proxyTypeOf(parsed),
    text: text.replace(embedded, unwrapProxyErrorMessage(deriveErrorMessage(parsed))).trim(),
  };
};

const describeError = (input: unknown): ErrorFacts => {
  if (input instanceof ApiError) {
    return { status: input.status, proxyType: proxyTypeOf(input.body), text: unwrapProxyErrorMessage(input.message) };
  }
  if (input instanceof Error || typeof input === "string") {
    return describeText(input instanceof Error ? input.message : input);
  }
  const record = asRecord(input) ?? {};
  const response = asRecord(record.response);
  const payload = asRecord(response?.data) ?? record;
  return {
    status:
      toStatus(response?.status) ??
      toStatus(record.status_code) ??
      toStatus(record.code) ??
      toStatus(proxyEnvelope(payload)?.code),
    proxyType: proxyTypeOf(payload),
    text: unwrapProxyErrorMessage(deriveErrorMessage(payload)),
  };
};

const titleForStatus = (status: number): ErrorTitle => {
  const known = STATUS_TITLES[status];
  if (known !== undefined) return known;
  if (status >= 500) return SERVER_ERROR;
  if (status >= 400) return REQUEST_ERROR;
  return GENERIC_ERROR;
};

const titleFor = ({ status, proxyType }: ErrorFacts): ErrorTitle => {
  if (proxyType?.endsWith("_access_denied")) return ACCESS_DENIED;
  const byType = proxyType === undefined ? undefined : PROXY_TYPE_TITLES[proxyType];
  if (byType !== undefined) return byType;
  return status === undefined ? GENERIC_ERROR : titleForStatus(status);
};

const show = (kind: ToastKind, message: ReactNode, options?: ToastOptions): void => {
  sonner[kind](message, {
    description: options?.description,
    duration: options?.durationMs ?? DEFAULT_DURATION_MS[kind],
  });
};

export const toast = {
  success: (message: ReactNode, options?: ToastOptions): void => show("success", message, options),
  info: (message: ReactNode, options?: ToastOptions): void => show("info", message, options),
  warning: (message: ReactNode, options?: ToastOptions): void => show("warning", message, options),
  error: (message: ReactNode, options?: ToastOptions): void => show("error", message, options),
  fromError: (input: unknown, options?: ToastOptions): void => {
    const facts = describeError(input);
    const title = titleFor(facts);
    show(title.warning ? "warning" : "error", i18n.t(title.key), { description: facts.text, ...options });
  },
  dismiss: (): void => {
    sonner.dismiss();
  },
} as const;
