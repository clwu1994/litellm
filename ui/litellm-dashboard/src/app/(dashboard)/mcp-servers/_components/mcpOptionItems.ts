import type { ParseKeys, TFunction } from "i18next";

import { AUTH_TYPE, AUTH_TYPE_ITEMS, TRANSPORT, TRANSPORT_ITEMS } from "@/components/mcp_tools/types";

const TRANSPORT_LABEL_KEYS: Record<string, ParseKeys<"mcpServers">> = {
  [TRANSPORT.HTTP]: "form.transportOptions.http",
  [TRANSPORT.SSE]: "form.transportOptions.sse",
  [TRANSPORT.STDIO]: "form.transportOptions.stdio",
  [TRANSPORT.OPENAPI]: "form.transportOptions.openapi",
};

const AUTH_TYPE_LABEL_KEYS: Record<string, ParseKeys<"mcpServers">> = {
  [AUTH_TYPE.NONE]: "form.authOptions.none",
  [AUTH_TYPE.API_KEY]: "form.authOptions.api_key",
  [AUTH_TYPE.BEARER_TOKEN]: "form.authOptions.bearer_token",
  [AUTH_TYPE.TOKEN]: "form.authOptions.token",
  [AUTH_TYPE.BASIC]: "form.authOptions.basic",
  [AUTH_TYPE.OAUTH2]: "form.authOptions.oauth2",
  [AUTH_TYPE.OAUTH2_TOKEN_EXCHANGE]: "form.authOptions.oauth2_token_exchange",
  [AUTH_TYPE.OAUTH2_ID_JAG]: "form.authOptions.oauth2_id_jag",
  [AUTH_TYPE.AWS_SIGV4]: "form.authOptions.aws_sigv4",
  [AUTH_TYPE.TRUE_PASSTHROUGH]: "form.authOptions.true_passthrough",
  [AUTH_TYPE.OAUTH_DELEGATE]: "form.authOptions.oauth_delegate",
};

const translateItems = (
  items: ReadonlyArray<{ value: string; label: string }>,
  keys: Record<string, ParseKeys<"mcpServers">>,
  t: TFunction<"mcpServers">,
) => items.map((item) => ({ ...item, label: keys[item.value] ? t(keys[item.value]) : item.label }));

export const transportItems = (t: TFunction<"mcpServers">) => translateItems(TRANSPORT_ITEMS, TRANSPORT_LABEL_KEYS, t);

export const authTypeItems = (t: TFunction<"mcpServers">) => translateItems(AUTH_TYPE_ITEMS, AUTH_TYPE_LABEL_KEYS, t);
