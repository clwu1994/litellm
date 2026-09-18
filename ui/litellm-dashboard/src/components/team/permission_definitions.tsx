export interface PermissionInfo {
  method: string;
  endpoint: string;
  descriptionKey: PermissionDescriptionKey;
  route: string;
}

export type PermissionDescriptionKey =
  | "permissions.description.generateKey"
  | "permissions.description.generateServiceAccountKey"
  | "permissions.description.updateKey"
  | "permissions.description.deleteKey"
  | "permissions.description.keyInfo"
  | "permissions.description.regenerateKey"
  | "permissions.description.listKeys"
  | "permissions.description.blockKey"
  | "permissions.description.unblockKey"
  | "permissions.description.assignAccessGroups"
  | "permissions.description.teamActivity"
  | "permissions.description.spendLogs"
  | "permissions.description.fallback";

/**
 * Map of permission endpoint patterns to their translation keys
 */
export const PERMISSION_DESCRIPTION_KEYS: Record<string, PermissionDescriptionKey> = {
  "/key/generate": "permissions.description.generateKey",
  "/key/service-account/generate": "permissions.description.generateServiceAccountKey",
  "/key/update": "permissions.description.updateKey",
  "/key/delete": "permissions.description.deleteKey",
  "/key/info": "permissions.description.keyInfo",
  "/key/regenerate": "permissions.description.regenerateKey",
  "/key/{key_id}/regenerate": "permissions.description.regenerateKey",
  "/key/list": "permissions.description.listKeys",
  "/key/block": "permissions.description.blockKey",
  "/key/unblock": "permissions.description.unblockKey",
  "/key/access_group_assignment": "permissions.description.assignAccessGroups",
  "/team/daily/activity": "permissions.description.teamActivity",
  "/spend/logs": "permissions.description.spendLogs",
};

/**
 * Determines the HTTP method for a given permission endpoint
 */
export const getMethodForEndpoint = (endpoint: string): string => {
  if (
    endpoint.includes("/info") ||
    endpoint.includes("/list") ||
    endpoint.includes("/activity") ||
    endpoint === "/spend/logs"
  ) {
    return "GET";
  }
  return "POST";
};

/**
 * Parses a permission string into a structured PermissionInfo object
 */
export const getPermissionInfo = (permission: string): PermissionInfo => {
  const method = getMethodForEndpoint(permission);
  const endpoint = permission;

  // Find exact match or fallback to the generic description key
  let descriptionKey = PERMISSION_DESCRIPTION_KEYS[permission];

  // If no exact match, try to find a partial match based on patterns
  if (!descriptionKey) {
    for (const [pattern, key] of Object.entries(PERMISSION_DESCRIPTION_KEYS)) {
      if (permission.includes(pattern)) {
        descriptionKey = key;
        break;
      }
    }
  }

  return {
    method,
    endpoint,
    descriptionKey: descriptionKey ?? "permissions.description.fallback",
    route: permission,
  };
};
