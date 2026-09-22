import type { ParseKeys } from "i18next";

export const SENSITIVE_FIELDS = new Set(["cyberark_api_key", "client_key"]);

export const FIELD_LABEL_KEYS: Record<string, ParseKeys<"settings">> = {
  cyberark_api_base: "cyberark.fields.cyberark_api_base",
  cyberark_account: "cyberark.fields.cyberark_account",
  cyberark_username: "cyberark.fields.cyberark_username",
  cyberark_api_key: "cyberark.fields.cyberark_api_key",
  client_cert: "cyberark.fields.client_cert",
  client_key: "cyberark.fields.client_key",
  ssl_verify: "cyberark.fields.ssl_verify",
  refresh_interval: "cyberark.fields.refresh_interval",
};
