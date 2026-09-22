import type { ParseKeys } from "i18next";

export type CoordinationFieldType = "string" | "password" | "integer" | "boolean" | "list";

export type CoordinationRedisType = "node" | "cluster" | "sentinel";

export type CoordinationSection = "connection" | "cluster" | "sentinel" | "ssl";

export type CoordinationFieldRule = (value: unknown) => ParseKeys<"caching"> | null;

export interface CoordinationField {
  readonly name: string;
  readonly labelKey: ParseKeys<"caching">;
  readonly type: CoordinationFieldType;
  readonly section: CoordinationSection;
  readonly helpTextKey: ParseKeys<"caching">;
  readonly redisType: CoordinationRedisType | null;
  readonly secret: boolean;
  readonly defaultValue?: string | number | boolean;
  readonly rules?: CoordinationFieldRule[];
}

export const COORDINATION_REDIS_TYPES: readonly CoordinationRedisType[] = ["node", "cluster", "sentinel"];

export const COORDINATION_REDIS_TYPE_DESCRIPTION_KEYS: Readonly<Record<CoordinationRedisType, ParseKeys<"caching">>> = {
  node: "redisType.nodeDescription",
  cluster: "redisType.clusterDescription",
  sentinel: "redisType.sentinelDescription",
};

export const COORDINATION_REDIS_TYPE_LABEL_KEYS: Readonly<Record<CoordinationRedisType, ParseKeys<"caching">>> = {
  node: "redisType.node",
  cluster: "redisType.cluster",
  sentinel: "redisType.sentinel",
};

const isBlank = (value: unknown): boolean => value === undefined || value === null || String(value).trim() === "";

const portRule: CoordinationFieldRule = (value) => {
  if (isBlank(value)) {
    return null;
  }
  const port = Number(value);
  return Number.isInteger(port) && port >= 1 && port <= 65535 ? null : "fields.rules.portRange";
};

const jsonListRule: CoordinationFieldRule = (value) => {
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

export const COORDINATION_FIELDS: readonly CoordinationField[] = [
  {
    name: "url",
    labelKey: "fields.url.label",
    type: "password",
    section: "connection",
    helpTextKey: "fields.url.coordinationHelp",
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
    secret: false,
  },
  {
    name: "port",
    labelKey: "fields.port.label",
    type: "integer",
    section: "connection",
    helpTextKey: "fields.port.help",
    redisType: null,
    secret: false,
    defaultValue: "6379",
    rules: [portRule],
  },
  {
    name: "username",
    labelKey: "fields.username.label",
    type: "string",
    section: "connection",
    helpTextKey: "fields.username.help",
    redisType: null,
    secret: false,
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
    name: "startup_nodes",
    labelKey: "fields.startupNodes.label",
    type: "list",
    section: "cluster",
    helpTextKey: "fields.startupNodes.coordinationHelp",
    redisType: "cluster",
    secret: false,
    rules: [jsonListRule],
  },
  {
    name: "sentinel_nodes",
    labelKey: "fields.sentinelNodes.label",
    type: "list",
    section: "sentinel",
    helpTextKey: "fields.sentinelNodes.help",
    redisType: "sentinel",
    secret: false,
    rules: [jsonListRule],
  },
  {
    name: "service_name",
    labelKey: "fields.serviceName.label",
    type: "string",
    section: "sentinel",
    helpTextKey: "fields.serviceName.help",
    redisType: "sentinel",
    secret: false,
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
    name: "ssl",
    labelKey: "fields.ssl.label",
    type: "boolean",
    section: "ssl",
    helpTextKey: "fields.ssl.help",
    redisType: null,
    secret: false,
    defaultValue: false,
  },
];
