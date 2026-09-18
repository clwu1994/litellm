import { describe, expect, it } from "vitest";
import i18n from "@/i18n/bootstrapI18n";
import {
  getMethodForEndpoint,
  getPermissionInfo,
  PERMISSION_DESCRIPTION_KEYS,
  type PermissionInfo,
} from "./permission_definitions";

const resolveDescription = (info: PermissionInfo): string =>
  i18n.t(info.descriptionKey, { ns: "teams", endpoint: info.endpoint });

describe("permission_definitions", () => {
  describe("getMethodForEndpoint", () => {
    it("should return GET for info endpoints", () => {
      expect(getMethodForEndpoint("/key/info")).toBe("GET");
    });

    it("should return GET for list endpoints", () => {
      expect(getMethodForEndpoint("/key/list")).toBe("GET");
    });

    it("should return GET for activity endpoints", () => {
      expect(getMethodForEndpoint("/team/daily/activity")).toBe("GET");
    });

    it("should return POST for other endpoints", () => {
      expect(getMethodForEndpoint("/key/generate")).toBe("POST");
      expect(getMethodForEndpoint("/key/update")).toBe("POST");
      expect(getMethodForEndpoint("/key/delete")).toBe("POST");
    });
  });

  describe("getPermissionInfo", () => {
    it("should return correct info for exact match permission", () => {
      const result = getPermissionInfo("/key/generate");
      expect(result.method).toBe("POST");
      expect(result.endpoint).toBe("/key/generate");
      expect(resolveDescription(result)).toBe("Member can generate a virtual key for this team");
      expect(result.route).toBe("/key/generate");
    });

    it("should return GET method for info endpoint", () => {
      const result = getPermissionInfo("/key/info");
      expect(result.method).toBe("GET");
      expect(result.endpoint).toBe("/key/info");
      expect(resolveDescription(result)).toBe("Member can get info about a virtual key belonging to this team");
    });

    it("should return GET method for list endpoint", () => {
      const result = getPermissionInfo("/key/list");
      expect(result.method).toBe("GET");
      expect(result.endpoint).toBe("/key/list");
      expect(resolveDescription(result)).toBe("Member can list virtual keys belonging to this team");
    });

    it("should find partial match for permission with pattern", () => {
      const result = getPermissionInfo("/key/service-account/generate");
      expect(result.method).toBe("POST");
      expect(result.endpoint).toBe("/key/service-account/generate");
      expect(resolveDescription(result)).toBe(
        "Member can generate a service account key (not belonging to any user) for this team",
      );
    });

    it("should return correct info for team daily activity permission", () => {
      const result = getPermissionInfo("/team/daily/activity");
      expect(result.method).toBe("GET");
      expect(result.endpoint).toBe("/team/daily/activity");
      expect(resolveDescription(result)).toBe("Member can view all team usage data (not just their own)");
      expect(result.route).toBe("/team/daily/activity");
    });

    it("should return fallback description for unknown permission", () => {
      const result = getPermissionInfo("/unknown/endpoint");
      expect(result.method).toBe("POST");
      expect(result.endpoint).toBe("/unknown/endpoint");
      expect(resolveDescription(result)).toBe("Access /unknown/endpoint");
      expect(result.route).toBe("/unknown/endpoint");
    });
  });

  describe("PERMISSION_DESCRIPTION_KEYS", () => {
    it("should resolve every endpoint pattern to a catalog string", () => {
      for (const key of Object.values(PERMISSION_DESCRIPTION_KEYS)) {
        const resolved = i18n.t(key, { ns: "teams" });
        expect(resolved).not.toBe(key);
        expect(resolved.length).toBeGreaterThan(0);
      }
    });

    it("should include team daily activity permission", () => {
      expect(resolveDescription(getPermissionInfo("/team/daily/activity"))).toContain("team usage");
    });

    it("should include spend logs permission", () => {
      expect(resolveDescription(getPermissionInfo("/spend/logs"))).toContain("spend logs");
    });
  });

  describe("spend/logs permission", () => {
    it("should return GET method for /spend/logs", () => {
      expect(getMethodForEndpoint("/spend/logs")).toBe("GET");
    });

    it("should return correct info for /spend/logs permission", () => {
      const result = getPermissionInfo("/spend/logs");
      expect(result.method).toBe("GET");
      expect(result.endpoint).toBe("/spend/logs");
      expect(resolveDescription(result)).toBe("Member can view spend logs for the entire team (not just their own)");
      expect(result.route).toBe("/spend/logs");
    });
  });
});
