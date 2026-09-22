import type { ParseKeys } from "i18next";

export const SENSITIVE_FIELDS = new Set(["vault_token", "approle_secret_id", "client_key"]);

export const FIELD_LABEL_KEYS: Record<string, ParseKeys<"settings">> = {
  vault_addr: "vault.fields.vault_addr",
  vault_namespace: "vault.fields.vault_namespace",
  vault_mount_name: "vault.fields.vault_mount_name",
  vault_path_prefix: "vault.fields.vault_path_prefix",
  vault_token: "vault.fields.vault_token",
  approle_role_id: "vault.fields.approle_role_id",
  approle_secret_id: "vault.fields.approle_secret_id",
  approle_mount_path: "vault.fields.approle_mount_path",
  client_cert: "vault.fields.client_cert",
  client_key: "vault.fields.client_key",
  vault_cert_role: "vault.fields.vault_cert_role",
};
