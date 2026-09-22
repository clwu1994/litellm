import type { ParseKeys } from "i18next";

export type CacheFieldType =
  | "string"
  | "password"
  | "integer"
  | "float"
  | "boolean"
  | "list"
  | "model-select"
  | "select";

export interface CacheFieldOption {
  readonly value: string;
  readonly labelKey: ParseKeys<"caching">;
}

export type RedisType = "node" | "cluster" | "sentinel" | "semantic";

export type CacheSection = "connection" | "cluster" | "sentinel" | "semantic" | "ssl" | "cacheManagement" | "gcp";

export type CacheFieldRule = (value: unknown) => ParseKeys<"caching"> | null;

// Marker the backend returns for a configured credential and maps back to the
// stored secret on save, so the plaintext never round-trips through the form.
export const REDACTED_VALUE = "***REDACTED***";

export interface CacheField {
  readonly name: string;
  readonly labelKey: ParseKeys<"caching">;
  readonly type: CacheFieldType;
  readonly section: CacheSection;
  readonly helpTextKey: ParseKeys<"caching">;
  readonly redisType: RedisType | null;
  readonly defaultValue?: string | number | boolean;
  readonly options?: readonly CacheFieldOption[];
  readonly rules?: CacheFieldRule[];
  // Credential field: never prefilled into the form, and dropped from the save
  // payload when left untouched so the redacted marker is never persisted.
  readonly secret?: boolean;
}

export const REDIS_TYPES: readonly RedisType[] = ["node", "cluster", "sentinel", "semantic"];

export const REDIS_TYPE_DESCRIPTION_KEYS: Readonly<Record<RedisType, ParseKeys<"caching">>> = {
  node: "redisType.nodeDescription",
  cluster: "redisType.clusterDescription",
  sentinel: "redisType.sentinelDescription",
  semantic: "redisType.semanticDescription",
};

const isBlank = (value: unknown): boolean => value === undefined || value === null || String(value).trim() === "";

const portRule: CacheFieldRule = (value) => {
  if (isBlank(value)) {
    return null;
  }
  const port = Number(value);
  return Number.isInteger(port) && port >= 1 && port <= 65535 ? null : "fields.rules.portRange";
};

const jsonListRule: CacheFieldRule = (value) => {
  if (isBlank(value)) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(value));
  } catch {
    return "fields.rules.jsonArraySyntax";
  }
  return Array.isArray(parsed) ? null : "fields.rules.jsonArray";
};

const nonNegativeIntegerRule: CacheFieldRule = (value) => {
  if (isBlank(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? null : "fields.rules.nonNegativeInteger";
};

const numberRule: CacheFieldRule = (value) => {
  if (isBlank(value)) {
    return null;
  }
  return Number.isNaN(Number(value)) ? "fields.rules.number" : null;
};

export const CACHE_FIELDS: readonly CacheField[] = [
  {
    name: "url",
    labelKey: "fields.url.label",
    type: "string",
    section: "connection",
    helpTextKey: "fields.url.help",
    redisType: null,
    secret: true,
  },
  {
    name: "host",
    labelKey: "fields.host.label",
    type: "string",
    section: "connection",
    helpTextKey: "fields.host.help",
    redisType: null,
  },
  {
    name: "port",
    labelKey: "fields.port.label",
    type: "string",
    section: "connection",
    helpTextKey: "fields.port.help",
    redisType: null,
    defaultValue: "6379",
    rules: [portRule],
  },
  {
    name: "db",
    labelKey: "fields.databaseIndex.label",
    type: "integer",
    section: "connection",
    helpTextKey: "fields.databaseIndex.help",
    redisType: null,
    rules: [nonNegativeIntegerRule],
  },
  {
    name: "password",
    labelKey: "fields.password.label",
    type: "password",
    section: "connection",
    helpTextKey: "fields.password.help",
    redisType: null,
    secret: true,
  },
  {
    name: "username",
    labelKey: "fields.username.label",
    type: "string",
    section: "connection",
    helpTextKey: "fields.username.help",
    redisType: null,
  },
  {
    name: "redis_startup_nodes",
    labelKey: "fields.startupNodes.label",
    type: "list",
    section: "cluster",
    helpTextKey: "fields.startupNodes.help",
    redisType: "cluster",
    rules: [jsonListRule],
  },
  {
    name: "sentinel_nodes",
    labelKey: "fields.sentinelNodes.label",
    type: "list",
    section: "sentinel",
    helpTextKey: "fields.sentinelNodes.help",
    redisType: "sentinel",
    rules: [jsonListRule],
  },
  {
    name: "service_name",
    labelKey: "fields.serviceName.label",
    type: "string",
    section: "sentinel",
    helpTextKey: "fields.serviceName.help",
    redisType: "sentinel",
  },
  {
    name: "sentinel_password",
    labelKey: "fields.sentinelPassword.label",
    type: "password",
    section: "sentinel",
    helpTextKey: "fields.sentinelPassword.help",
    redisType: "sentinel",
    secret: true,
  },
  {
    name: "similarity_threshold",
    labelKey: "fields.similarityThreshold.label",
    type: "float",
    section: "semantic",
    helpTextKey: "fields.similarityThreshold.help",
    redisType: "semantic",
    defaultValue: 0.8,
    rules: [numberRule],
  },
  {
    name: "redis_semantic_cache_embedding_model",
    labelKey: "fields.embeddingModel.label",
    type: "model-select",
    section: "semantic",
    helpTextKey: "fields.embeddingModel.help",
    redisType: "semantic",
  },
  {
    name: "semantic_cache_scope",
    labelKey: "fields.semanticCacheScope.label",
    type: "select",
    section: "semantic",
    helpTextKey: "fields.semanticCacheScope.help",
    redisType: "semantic",
    defaultValue: "key",
    options: [
      { value: "key", labelKey: "fields.semanticCacheScope.key" },
      { value: "end_user", labelKey: "fields.semanticCacheScope.endUser" },
    ],
  },
  {
    name: "ssl",
    labelKey: "fields.ssl.label",
    type: "boolean",
    section: "ssl",
    helpTextKey: "fields.ssl.help",
    redisType: null,
    defaultValue: false,
  },
  {
    name: "ssl_cert_reqs",
    labelKey: "fields.sslCertReqs.label",
    type: "string",
    section: "ssl",
    helpTextKey: "fields.sslCertReqs.help",
    redisType: null,
  },
  {
    name: "ssl_check_hostname",
    labelKey: "fields.sslCheckHostname.label",
    type: "boolean",
    section: "ssl",
    helpTextKey: "fields.sslCheckHostname.help",
    redisType: null,
    defaultValue: false,
  },
  {
    name: "namespace",
    labelKey: "fields.namespace.label",
    type: "string",
    section: "cacheManagement",
    helpTextKey: "fields.namespace.help",
    redisType: null,
  },
  {
    name: "ttl",
    labelKey: "fields.ttl.label",
    type: "float",
    section: "cacheManagement",
    helpTextKey: "fields.ttl.help",
    redisType: null,
    rules: [numberRule],
  },
  {
    name: "max_connections",
    labelKey: "fields.maxConnections.label",
    type: "integer",
    section: "cacheManagement",
    helpTextKey: "fields.maxConnections.help",
    redisType: null,
    rules: [nonNegativeIntegerRule],
  },
  {
    name: "gcp_service_account",
    labelKey: "fields.gcpServiceAccount.label",
    type: "string",
    section: "gcp",
    helpTextKey: "fields.gcpServiceAccount.help",
    redisType: null,
  },
  {
    name: "gcp_ssl_ca_certs",
    labelKey: "fields.gcpSslCaCerts.label",
    type: "string",
    section: "gcp",
    helpTextKey: "fields.gcpSslCaCerts.help",
    redisType: null,
  },
];
